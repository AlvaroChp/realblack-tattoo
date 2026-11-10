package com.realblacktattoo.persistence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class CollectionRepository {

    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) {
            super(message);
        }
    }

    private record Column(String json, String sql, Kind kind) {
        boolean isId() {
            return "id".equals(json);
        }
    }

    private record Spec(String table, List<Column> columns, String defaultSort, Set<String> allowedStatuses) {
    }

    private static final Column ID = new Column("id", "id", Kind.LONG);
    private static final Column CREATED_AT = new Column("createdAt", "created_at", Kind.INSTANT);

    private static final Map<String, Spec> SPECS = Map.of(
            "users", new Spec("users", List.of(
                    ID,
                    new Column("username", "username", Kind.STRING),
                    new Column("password", "password", Kind.STRING),
                    new Column("role", "role", Kind.STRING)),
                    "id", Set.of("admin", "manager")),
            "artists", new Spec("artists", List.of(
                    ID,
                    new Column("name", "name", Kind.STRING),
                    new Column("bio", "bio", Kind.STRING),
                    new Column("specialty", "specialty", Kind.STRING),
                    new Column("image", "image", Kind.STRING),
                    CREATED_AT),
                    "id", Set.of()),
            "portfolio", new Spec("portfolio", List.of(
                    ID,
                    new Column("title", "title", Kind.STRING),
                    new Column("description", "description", Kind.STRING),
                    new Column("artistId", "artist_id", Kind.LONG),
                    new Column("image", "image", Kind.STRING)),
                    "id", Set.of()),
            "videos", new Spec("videos", List.of(
                    ID,
                    new Column("title", "title", Kind.STRING),
                    new Column("url", "url", Kind.STRING)),
                    "id", Set.of()),
            "requests", new Spec("requests", List.of(
                    ID,
                    new Column("name", "name", Kind.STRING),
                    new Column("email", "email", Kind.STRING),
                    new Column("phone", "phone", Kind.STRING),
                    new Column("artist", "artist", Kind.STRING),
                    new Column("style", "style", Kind.STRING),
                    new Column("bodyPart", "body_part", Kind.STRING),
                    new Column("size", "size", Kind.STRING),
                    new Column("idea", "idea", Kind.STRING),
                    new Column("observations", "observations", Kind.STRING),
                    new Column("referenceImage", "reference_image", Kind.STRING),
                    new Column("status", "status", Kind.STRING),
                    CREATED_AT),
                    "created_at DESC, id DESC", Set.of("pendiente", "aceptada", "rechazada")),
            "appointments", new Spec("appointments", List.of(
                    ID,
                    new Column("clientName", "client_name", Kind.STRING),
                    new Column("clientEmail", "client_email", Kind.STRING),
                    new Column("clientPhone", "client_phone", Kind.STRING),
                    new Column("artistName", "artist_name", Kind.STRING),
                    new Column("style", "style", Kind.STRING),
                    new Column("date", "date", Kind.DATE),
                    new Column("time", "time", Kind.TIME),
                    new Column("notes", "notes", Kind.STRING),
                    new Column("requestId", "request_id", Kind.LONG),
                    new Column("status", "status", Kind.STRING),
                    CREATED_AT),
                    "date DESC, time DESC, id DESC",
                    Set.of("confirmada", "pendiente", "cancelada", "completada")));

    private enum Kind {
        STRING, LONG, DATE, TIME, INSTANT
    }

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final ObjectMapper mapper;

    public CollectionRepository(JdbcTemplate jdbcTemplate, DataSource dataSource, ObjectMapper mapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.mapper = mapper;
    }

    public boolean hasCollection(String collection) {
        return SPECS.containsKey(collection);
    }

    public ArrayNode list(String collection) {
        Spec spec = spec(collection);
        ArrayNode result = mapper.createArrayNode();
        for (Map<String, Object> row : readAll(spec)) {
            result.add(toJson(spec, row));
        }
        return result;
    }

    public ObjectNode find(String collection, long id) {
        Spec spec = spec(collection);
        List<Map<String, Object>> rows = jdbcTemplate.query(
                "SELECT " + selectList(spec) + " FROM " + spec.table() + " WHERE id = ?",
                (rs, rowNum) -> readRow(spec, rs),
                id);
        return rows.isEmpty() ? null : toJson(spec, rows.get(0));
    }

    public ObjectNode create(String collection, ObjectNode body) {
        Spec spec = spec(collection);
        validateStatus(spec, body);
        List<Column> columns = writableColumns(spec, body, true);
        String sql = "INSERT INTO " + spec.table() + " ("
                + String.join(", ", columns.stream().map(Column::sql).toList())
                + ") VALUES (" + String.join(", ", columns.stream().map(c -> "?").toList()) + ")";
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try {
            connection.setAutoCommit(false);
            long id;
            ObjectNode row = newEmptyRow();
            try (PreparedStatement statement = connection.prepareStatement(sql, new String[]{"id"})) {
                int index = 1;
                for (Column column : columns) {
                    statement.setObject(index++, toSqlValue(column, body.get(column.json()), column.isId()));
                    row.set(column.json(), body.path(column.json()));
                }
                statement.executeUpdate();
                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException("No se pudo obtener el id generado.");
                    }
                    id = keys.getLong(1);
                }
            }
            connection.commit();
            ObjectNode created = find(collection, id);
            return created != null ? created : row;
        } catch (SQLException exception) {
            rollback(connection);
            throw translate(exception);
        } finally {
            restoreAutoCommit(connection);
            DataSourceUtils.releaseConnection(connection, dataSource);
        }
    }

    public ObjectNode update(String collection, long id, ObjectNode changes) {
        Spec spec = spec(collection);
        validateStatus(spec, changes);
        List<Column> columns = writableColumns(spec, changes, false);
        if (columns.isEmpty()) {
            return find(collection, id);
        }
        String sql = "UPDATE " + spec.table() + " SET "
                + String.join(", ", columns.stream().map(c -> c.sql() + " = ?").toList())
                + " WHERE id = ?";
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try {
            connection.setAutoCommit(false);
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                int index = 1;
                for (Column column : columns) {
                    statement.setObject(index++, toSqlValue(column, changes.get(column.json()), false));
                }
                statement.setLong(index, id);
                int updated = statement.executeUpdate();
                if (updated == 0) {
                    connection.rollback();
                    return null;
                }
            }
            connection.commit();
        } catch (SQLException exception) {
            rollback(connection);
            throw translate(exception);
        } finally {
            restoreAutoCommit(connection);
            DataSourceUtils.releaseConnection(connection, dataSource);
        }
        return find(collection, id);
    }

    public boolean delete(String collection, long id) {
        Spec spec = spec(collection);
        return jdbcTemplate.update("DELETE FROM " + spec.table() + " WHERE id = ?", id) > 0;
    }

    private List<Map<String, Object>> readAll(Spec spec) {
        return jdbcTemplate.query(
                "SELECT " + selectList(spec) + " FROM " + spec.table() + " ORDER BY " + spec.defaultSort(),
                (rs, rowNum) -> readRow(spec, rs));
    }

    private Map<String, Object> readRow(Spec spec, ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        ResultSetMetaData meta = rs.getMetaData();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            row.put(meta.getColumnLabel(i).toLowerCase(), rs.getObject(i));
        }
        return row;
    }

    private ObjectNode toJson(Spec spec, Map<String, Object> row) {
        ObjectNode node = mapper.createObjectNode();
        for (Column column : spec.columns()) {
            Object value = row.get(column.sql());
            if (value == null) {
                node.putNull(column.json());
            } else if (column.kind() == Kind.LONG) {
                node.put(column.json(), ((Number) value).longValue());
            } else if (column.kind() == Kind.INSTANT) {
                node.put(column.json(), formatInstant(value));
            } else if (column.kind() == Kind.DATE) {
                node.put(column.json(), value instanceof java.sql.Date date ? date.toLocalDate().toString() : value.toString().substring(0, 10));
            } else if (column.kind() == Kind.TIME) {
                node.put(column.json(), value instanceof java.sql.Time time ? time.toLocalTime().toString() : value.toString());
            } else {
                node.put(column.json(), value.toString());
            }
        }
        return node;
    }

    private static String formatInstant(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime().toString();
        }
        return value.toString();
    }

    private static String selectList(Spec spec) {
        return String.join(", ", spec.columns().stream().map(Column::sql).toList());
    }

    private List<Column> writableColumns(Spec spec, ObjectNode body, boolean insert) {
        List<Column> columns = new ArrayList<>();
        for (Column column : spec.columns()) {
            if (column.isId()) {
                continue;
            }
            if (column.kind() == Kind.INSTANT) {
                if (insert && !body.hasNonNull(column.json())) {
                    continue;
                }
                if (!body.has(column.json())) {
                    continue;
                }
            }
            if (!insert && !body.has(column.json())) {
                continue;
            }
            columns.add(column);
        }
        return columns;
    }

    private Object toSqlValue(Column column, JsonNode value, boolean isId) {
        if (column.kind() == Kind.INSTANT) {
            return null;
        }
        if (value == null || value.isNull()) {
            return null;
        }
        return switch (column.kind()) {
            case STRING -> {
                String text = value.isTextual() ? value.asText() : value.toString();
                if (isId) {
                    throw new BadRequestException("El id no puede especificarse manualmente.");
                }
                yield text;
            }
            case LONG -> value.isNumber() ? value.asLong() : null;
            case DATE -> value.isNull() ? null : parseDate(value.asText());
            case TIME -> value.isNull() ? null : parseTime(value.asText());
            case INSTANT -> null;
        };
    }

    private static LocalDate parseDate(String text) {
        try {
            return text == null || text.isBlank() ? null : LocalDate.parse(text.trim());
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Fecha no válida: " + text);
        }
    }

    private static LocalTime parseTime(String text) {
        try {
            return text == null || text.isBlank() ? null : LocalTime.parse(text.trim());
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("Hora no válida: " + text);
        }
    }

    private static void validateStatus(Spec spec, ObjectNode body) {
        if (spec.allowedStatuses().isEmpty() || !body.hasNonNull("status")) {
            return;
        }
        String status = body.path("status").asText();
        if (!spec.allowedStatuses().contains(status)) {
            throw new BadRequestException("El estado indicado no es válido.");
        }
    }

    private ObjectNode newEmptyRow() {
        return mapper.createObjectNode();
    }

    private Spec spec(String collection) {
        Spec spec = SPECS.get(collection);
        if (spec == null) {
            throw new IllegalArgumentException("Colección desconocida: " + collection);
        }
        return spec;
    }

    private static void rollback(Connection connection) {
        try {
            connection.rollback();
        } catch (SQLException ignored) {
            // la conexión ya estaba cerrada
        }
    }

    private static void restoreAutoCommit(Connection connection) {
        try {
            connection.setAutoCommit(true);
        } catch (SQLException ignored) {
            // la conexión ya estaba cerrada
        }
    }

    private static RuntimeException translate(SQLException exception) {
        if (exception instanceof java.sql.SQLIntegrityConstraintViolationException integrity) {
            String message = String.valueOf(integrity.getMessage()).toLowerCase();
            if (message.contains("status")) {
                return new BadRequestException("El estado indicado no es válido.");
            }
            if (message.contains("role")) {
                return new BadRequestException("El rol indicado no es válido.");
            }
            if (message.contains("username")) {
                return new BadRequestException("Ese nombre de usuario ya existe.");
            }
            if (message.contains("not-null") || message.contains("null value")) {
                return new BadRequestException("Faltan campos obligatorios o algún valor no es válido.");
            }
        }
        return new IllegalStateException("No se pudo acceder a la base de datos.", exception);
    }
}
