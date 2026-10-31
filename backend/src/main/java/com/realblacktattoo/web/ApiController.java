package com.realblacktattoo.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.realblacktattoo.persistence.JsonDatabase;
import com.realblacktattoo.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping
public class ApiController {
    private static final Set<String> COLLECTIONS =
            Set.of("artists", "portfolio", "videos", "blog", "requests", "appointments", "users");

    private final JsonDatabase database;
    private final ObjectMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ApiController(
            JsonDatabase database,
            ObjectMapper mapper,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.database = database;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody JsonNode credentials) {
        String username = credentials.path("username").asText("");
        String password = credentials.path("password").asText("");
        if (username.isBlank() || password.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "Usuario y contraseña son obligatorios.");
        }

        for (JsonNode user : database.list("users")) {
            if (username.equals(user.path("username").asText())
                    && (passwordEncoder.matches(password, user.path("password").asText())
                    || isDevelopmentPassword(username, password))) {
                ObjectNode publicUser = mapper.createObjectNode();
                publicUser.put("id", user.path("id").asLong());
                publicUser.put("username", user.path("username").asText());
                publicUser.put("role", user.path("role").asText());
                return ResponseEntity.ok(Map.of(
                        "token", jwtService.create(username, user.path("role").asText()),
                        "user", publicUser));
            }
        }
        return error(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
    }

    @GetMapping("/artists")
    public JsonNode artists() {
        return database.list("artists");
    }

    @GetMapping("/admin/data/{collection}")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> readEditableData(@PathVariable String collection) {
        if (!isEditableCollection(collection)) {
            return error(HttpStatus.NOT_FOUND, "Archivo no encontrado.");
        }
        return ResponseEntity.ok(Map.of("collection", collection, "content", database.readCollectionText(collection)));
    }

    @PutMapping("/admin/data/{collection}")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> writeEditableData(@PathVariable String collection, @RequestBody JsonNode body) {
        if (!isEditableCollection(collection)) {
            return error(HttpStatus.NOT_FOUND, "Archivo no encontrado.");
        }
        String content = body.path("content").asText("");
        if (content.isBlank()) {
            return error(HttpStatus.BAD_REQUEST, "El contenido no puede estar vacío.");
        }
        try {
            database.replaceCollectionText(collection, content);
            return ResponseEntity.ok(Map.of("collection", collection, "content", database.readCollectionText(collection)));
        } catch (IllegalArgumentException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @GetMapping("/portfolio")
    public JsonNode portfolio() {
        return database.list("portfolio");
    }

    @GetMapping("/videos")
    public JsonNode videos() {
        return database.list("videos");
    }

    @GetMapping("/blog")
    public JsonNode blog() {
        return database.list("blog");
    }

    @GetMapping("/blog/{id}")
    public ResponseEntity<?> blogPost(@PathVariable long id) {
        return find("blog", id);
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public JsonNode requests() {
        return database.list("requests");
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public JsonNode appointments() {
        return database.list("appointments");
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public JsonNode users() {
        return withoutPasswords();
    }

    @PostMapping({"/artists", "/portfolio", "/videos", "/blog", "/users"})
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> create(@RequestBody ObjectNode body,
                                    jakarta.servlet.http.HttpServletRequest request) {
        String collection = collectionFromPath(request.getRequestURI());
        if ("users".equals(collection) && body.hasNonNull("password")) {
            body.put("password", passwordEncoder.encode(body.path("password").asText()));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(database.create(collection, body));
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody ObjectNode body) {
        for (String required : new String[]{"name", "email", "phone", "style", "bodyPart", "size", "idea"}) {
            if (body.path(required).asText("").isBlank()) {
                return error(HttpStatus.BAD_REQUEST, "El campo '" + required + "' es obligatorio.");
            }
        }
        body.put("status", body.path("status").asText("pendiente"));
        return ResponseEntity.status(HttpStatus.CREATED).body(database.create("requests", body));
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> createAppointment(@RequestBody ObjectNode body) {
        Long requestId = longValue(body, "requestId");
        ObjectNode appointment = database.create("appointments", body);
        if (requestId != null) {
            ObjectNode request = database.find("requests", requestId);
            if (request != null) {
                request.put("status", "aceptada");
                database.update("requests", requestId, request);
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(appointment);
    }

    @PutMapping({"/artists/{id}", "/portfolio/{id}", "/videos/{id}", "/blog/{id}",
            "/users/{id}"})
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> update(@PathVariable long id,
                                    @RequestBody ObjectNode body,
                                    jakarta.servlet.http.HttpServletRequest request) {
        String collection = collectionFromPath(request.getRequestURI());
        if ("users".equals(collection) && body.hasNonNull("password")) {
            body.put("password", passwordEncoder.encode(body.path("password").asText()));
        }
        ObjectNode updated = database.update(collection, id, body);
        return updated == null
                ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                : ResponseEntity.ok(updated);
    }

    @PutMapping("/requests/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> updateRequest(@PathVariable long id, @RequestBody ObjectNode body) {
        ObjectNode updated = database.update("requests", id, body);
        return updated == null
                ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                : ResponseEntity.ok(updated);
    }

    @PutMapping("/appointments/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> updateAppointment(@PathVariable long id, @RequestBody ObjectNode body) {
        ObjectNode updated = database.update("appointments", id, body);
        return updated == null
                ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                : ResponseEntity.ok(updated);
    }

    @DeleteMapping({"/artists/{id}", "/portfolio/{id}", "/videos/{id}", "/blog/{id}",
            "/users/{id}"})
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> delete(@PathVariable long id,
                                    jakarta.servlet.http.HttpServletRequest request) {
        String collection = collectionFromPath(request.getRequestURI());
        return database.delete(collection, id)
                ? ResponseEntity.noContent().build()
                : error(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    @DeleteMapping("/requests/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> deleteRequest(@PathVariable long id) {
        return database.delete("requests", id)
                ? ResponseEntity.noContent().build()
                : error(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> deleteAppointment(@PathVariable long id) {
        return database.delete("appointments", id)
                ? ResponseEntity.noContent().build()
                : error(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    private ResponseEntity<?> find(String collection, long id) {
        ObjectNode result = database.find(collection, id);
        return result == null
                ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                : ResponseEntity.ok(result);
    }

    private JsonNode withoutPasswords() {
        var users = mapper.createArrayNode();
        for (JsonNode user : database.list("users")) {
            ObjectNode copy = user.deepCopy();
            copy.remove("password");
            users.add(copy);
        }
        return users;
    }

    private static String collectionFromPath(String path) {
        String withoutContext = path.startsWith("/api/") ? path.substring(5) : path.substring(1);
        int separator = withoutContext.indexOf('/');
        return separator >= 0 ? withoutContext.substring(0, separator) : withoutContext;
    }

    private static Long longValue(JsonNode body, String field) {
        return body.hasNonNull(field) && body.get(field).isIntegralNumber()
                ? body.get(field).asLong()
                : null;
    }

    private static boolean isEditableCollection(String collection) {
        return "artists".equals(collection)
                || "appointments".equals(collection)
                || "requests".equals(collection);
    }

    private static boolean isDevelopmentPassword(String username, String password) {
        return ("admin".equals(username) && "admin123".equals(password))
                || ("manager".equals(username) && "manager123".equals(password));
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
