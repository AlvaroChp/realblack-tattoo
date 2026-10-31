package com.realblacktattoo.persistence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

@Component
public class JsonDatabase {
    private static final Set<String> TEXT_COLLECTIONS = Set.of("artists", "appointments", "requests");
    private final ObjectMapper mapper;
    private final Path file;
    private ObjectNode root;

    public JsonDatabase(ObjectMapper mapper) {
        this.mapper = mapper;
        this.file = resolveFile();
        this.root = load();
        loadTextCollections();
    }

    public synchronized ArrayNode list(String collection) {
        return (ArrayNode) root.withArray(collection);
    }

    public synchronized ObjectNode create(String collection, ObjectNode value) {
        ArrayNode items = list(collection);
        value.put("id", nextId(items));
        if (value.get("createdAt") == null) {
            value.put("createdAt", Instant.now().toString());
        }
        items.add(value);
        saveCollection(collection);
        return value;
    }

    public synchronized ObjectNode find(String collection, long id) {
        for (JsonNode item : list(collection)) {
            if (item.path("id").asLong() == id) {
                return (ObjectNode) item;
            }
        }
        return null;
    }

    public synchronized ObjectNode update(String collection, long id, ObjectNode changes) {
        ObjectNode current = find(collection, id);
        if (current == null) {
            return null;
        }
        Iterator<Map.Entry<String, JsonNode>> fields = changes.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            if (!field.getKey().equals("id")) {
                current.set(field.getKey(), field.getValue());
            }
        }
        saveCollection(collection);
        return current;
    }

    public synchronized boolean delete(String collection, long id) {
        ArrayNode items = list(collection);
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).path("id").asLong() == id) {
                items.remove(i);
                saveCollection(collection);
                return true;
            }
        }
        return false;
    }

    public synchronized String readCollectionText(String collection) {
        requireTextCollection(collection);
        try {
            return Files.readString(collectionFile(collection));
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo leer " + collection + ".txt", exception);
        }
    }

    public synchronized ArrayNode replaceCollectionText(String collection, String text) {
        requireTextCollection(collection);
        try {
            JsonNode parsed = mapper.readTree(text);
            if (parsed == null || !parsed.isArray()) {
                throw new IllegalArgumentException("El contenido debe ser un array JSON.");
            }
            root.set(collection, parsed);
            saveCollection(collection);
            return list(collection);
        } catch (IOException exception) {
            throw new IllegalArgumentException("El contenido no es JSON válido.", exception);
        }
    }

    private void loadTextCollections() {
        for (String collection : TEXT_COLLECTIONS) {
            Path textFile = collectionFile(collection);
            try {
                if (Files.exists(textFile)) {
                    JsonNode loaded = mapper.readTree(textFile.toFile());
                    if (loaded == null || !loaded.isArray()) {
                        throw new IllegalStateException(textFile + " debe contener un array JSON.");
                    }
                    root.set(collection, loaded);
                } else {
                    saveCollection(collection);
                }
            } catch (IOException exception) {
                throw new IllegalStateException("No se pudo leer " + textFile, exception);
            }
        }
    }

    private void saveCollection(String collection) {
        if (!TEXT_COLLECTIONS.contains(collection)) {
            save();
            return;
        }
        try {
            Path textFile = collectionFile(collection);
            Files.createDirectories(textFile.getParent());
            Path temporary = textFile.resolveSibling(textFile.getFileName() + ".tmp");
            mapper.writerWithDefaultPrettyPrinter().writeValue(temporary.toFile(), list(collection));
            Files.move(temporary, textFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo guardar " + collection + ".txt", exception);
        }
    }

    private Path collectionFile(String collection) {
        return file.resolveSibling(collection + ".txt");
    }

    private static void requireTextCollection(String collection) {
        if (!TEXT_COLLECTIONS.contains(collection)) {
            throw new IllegalArgumentException("Colección no editable.");
        }
    }

    private ObjectNode load() {
        try {
            if (Files.notExists(file)) {
                Files.createDirectories(file.getParent());
                return mapper.createObjectNode();
            }
            JsonNode loaded = mapper.readTree(file.toFile());
            return loaded != null && loaded.isObject()
                    ? (ObjectNode) loaded
                    : mapper.createObjectNode();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo leer " + file, exception);
        }
    }

    private void save() {
        try {
            Files.createDirectories(file.getParent());
            Path temporary = file.resolveSibling(file.getFileName() + ".tmp");
            mapper.writerWithDefaultPrettyPrinter().writeValue(temporary.toFile(), root);
            Files.move(temporary, file, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo guardar " + file, exception);
        }
    }

    private static Path resolveFile() {
        Path fromBackend = Paths.get("data", "db.json");
        return Files.exists(fromBackend) ? fromBackend : Paths.get("backend", "data", "db.json");
    }

    private static long nextId(ArrayNode items) {
        long highest = 0;
        for (JsonNode item : items) {
            highest = Math.max(highest, item.path("id").asLong());
        }
        return highest + 1;
    }
}
