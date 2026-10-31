package com.realblacktattoo.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class JwtService {
    private static final String SECRET = "realblack-tattoo-development-secret-change-in-production";
    private static final long VALIDITY_SECONDS = 8 * 60 * 60;
    private final ObjectMapper mapper;

    public JwtService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public String create(String username, String role) {
        try {
            String header = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
            String payload = encode(mapper.writeValueAsString(Map.of(
                    "sub", username,
                    "role", role,
                    "exp", Instant.now().getEpochSecond() + VALIDITY_SECONDS
            )));
            return header + "." + payload + "." + sign(header + "." + payload);
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo crear el token", exception);
        }
    }

    public Map<String, Object> parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
                return null;
            }
            Map<String, Object> claims = mapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]), Map.class);
            if (((Number) claims.get("exp")).longValue() <= Instant.now().getEpochSecond()) {
                return null;
            }
            return claims;
        } catch (Exception exception) {
            return null;
        }
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }

    private static String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                value.getBytes(StandardCharsets.UTF_8));
    }
}
