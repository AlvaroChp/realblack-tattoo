package com.realblacktattoo.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.realblacktattoo.persistence.CollectionRepository;
import com.realblacktattoo.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping
public class ApiController {

    private final CollectionRepository repository;
    private final ObjectMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ApiController(
            CollectionRepository repository,
            ObjectMapper mapper,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.repository = repository;
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

        JsonNode user = null;
        for (JsonNode candidate : repository.list("users")) {
            if (username.equals(candidate.path("username").asText())) {
                user = candidate;
                break;
            }
        }
        if (user != null && passwordEncoder.matches(password, user.path("password").asText())) {
            ObjectNode publicUser = mapper.createObjectNode();
            publicUser.put("id", user.path("id").asLong());
            publicUser.put("username", user.path("username").asText());
            publicUser.put("role", user.path("role").asText());
            return ResponseEntity.ok(Map.of(
                    "token", jwtService.create(username, user.path("role").asText()),
                    "user", publicUser));
        }
        return error(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos.");
    }

    @GetMapping("/artists")
    public JsonNode artists() {
        return repository.list("artists");
    }

    @GetMapping("/portfolio")
    public JsonNode portfolio() {
        return repository.list("portfolio");
    }

    @GetMapping("/videos")
    public JsonNode videos() {
        return repository.list("videos");
    }

    @GetMapping("/blog")
    public JsonNode blog() {
        return repository.list("blog");
    }

    @GetMapping("/blog/{id}")
    public ResponseEntity<?> blogPost(@PathVariable long id) {
        return find("blog", id);
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public JsonNode requests() {
        return repository.list("requests");
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public JsonNode appointments() {
        return repository.list("appointments");
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public JsonNode users() {
        var users = mapper.createArrayNode();
        for (JsonNode user : repository.list("users")) {
            ObjectNode copy = user.deepCopy();
            copy.remove("password");
            users.add(copy);
        }
        return users;
    }

    @PostMapping({"/artists", "/portfolio", "/videos", "/blog", "/users"})
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> create(@RequestBody ObjectNode body,
                                    jakarta.servlet.http.HttpServletRequest request) {
        String collection = collectionFromPath(request.getRequestURI());
        if ("users".equals(collection) && body.hasNonNull("password")) {
            body.put("password", passwordEncoder.encode(body.path("password").asText()));
        }
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(repository.create(collection, body));
        } catch (CollectionRepository.BadRequestException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody ObjectNode body) {
        for (String required : new String[]{"name", "email", "phone", "style", "bodyPart", "size", "idea"}) {
            if (body.path(required).asText("").isBlank()) {
                return error(HttpStatus.BAD_REQUEST, "El campo '" + required + "' es obligatorio.");
            }
        }
        body.put("status", "pendiente");
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(repository.create("requests", body));
        } catch (CollectionRepository.BadRequestException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    @Transactional
    public ResponseEntity<?> createAppointment(@RequestBody ObjectNode body) {
        Long requestId = longValue(body, "requestId");
        try {
            if (!body.hasNonNull("status")) {
                body.put("status", "confirmada");
            }
            ObjectNode appointment = repository.create("appointments", body);
            if (requestId != null) {
                ObjectNode markAccepted = mapper.createObjectNode();
                markAccepted.put("status", "aceptada");
                repository.update("requests", requestId, markAccepted);
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(appointment);
        } catch (CollectionRepository.BadRequestException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PutMapping({"/artists/{id}", "/portfolio/{id}", "/videos/{id}", "/blog/{id}", "/users/{id}"})
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> update(@PathVariable long id,
                                    @RequestBody ObjectNode body,
                                    jakarta.servlet.http.HttpServletRequest request) {
        String collection = collectionFromPath(request.getRequestURI());
        if ("users".equals(collection) && body.hasNonNull("password")) {
            body.put("password", passwordEncoder.encode(body.path("password").asText()));
        }
        try {
            ObjectNode updated = repository.update(collection, id, body);
            return updated == null
                    ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                    : ResponseEntity.ok(updated);
        } catch (CollectionRepository.BadRequestException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PutMapping("/requests/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> updateRequest(@PathVariable long id, @RequestBody ObjectNode body) {
        try {
            ObjectNode updated = repository.update("requests", id, body);
            return updated == null
                    ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                    : ResponseEntity.ok(updated);
        } catch (CollectionRepository.BadRequestException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PutMapping("/appointments/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> updateAppointment(@PathVariable long id, @RequestBody ObjectNode body) {
        try {
            ObjectNode updated = repository.update("appointments", id, body);
            return updated == null
                    ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                    : ResponseEntity.ok(updated);
        } catch (CollectionRepository.BadRequestException exception) {
            return error(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @DeleteMapping({"/artists/{id}", "/portfolio/{id}", "/videos/{id}", "/blog/{id}", "/users/{id}"})
    @PreAuthorize("hasAuthority('ROLE_admin')")
    public ResponseEntity<?> delete(@PathVariable long id,
                                    jakarta.servlet.http.HttpServletRequest request) {
        String collection = collectionFromPath(request.getRequestURI());
        return repository.delete(collection, id)
                ? ResponseEntity.noContent().build()
                : error(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    @DeleteMapping("/requests/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> deleteRequest(@PathVariable long id) {
        return repository.delete("requests", id)
                ? ResponseEntity.noContent().build()
                : error(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_admin', 'ROLE_manager')")
    public ResponseEntity<?> deleteAppointment(@PathVariable long id) {
        return repository.delete("appointments", id)
                ? ResponseEntity.noContent().build()
                : error(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    private ResponseEntity<?> find(String collection, long id) {
        ObjectNode result = repository.find(collection, id);
        return result == null
                ? error(HttpStatus.NOT_FOUND, "Recurso no encontrado.")
                : ResponseEntity.ok(result);
    }

    @ExceptionHandler(CollectionRepository.BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(CollectionRepository.BadRequestException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage());
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

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
