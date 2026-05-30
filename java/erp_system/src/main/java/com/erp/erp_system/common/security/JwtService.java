package com.erp.erp_system.common.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class JwtService {
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private final ObjectMapper mapper;
    private final String secret;
    private final long expirationMinutes;

    public JwtService(ObjectMapper mapper, @Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.mapper = mapper;
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
    }

    /** Creates a signed JWT for an authenticated employee. */
    public String generateToken(String email, Collection<String> roles) {
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", email);
        claims.put("roles", roles);
        claims.put("exp", Instant.now().plusSeconds(expirationMinutes * 60).getEpochSecond());
        String content = encode(header) + "." + encode(claims);
        return content + "." + sign(content);
    }

    /** Extracts the username from a valid token. */
    public String extractUsername(String token) {
        return claims(token).get("sub").toString();
    }

    /** Validates signature and expiry for a token. */
    public boolean isValid(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) return false;
        Number exp = (Number) claims(token).get("exp");
        return Instant.now().getEpochSecond() < exp.longValue();
    }

    private String encode(Object value) {
        try {
            return ENCODER.encodeToString(mapper.writeValueAsBytes(value));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to encode token", ex);
        }
    }

    private Map<String, Object> claims(String token) {
        try {
            String payload = new String(DECODER.decode(token.split("\\.")[1]), StandardCharsets.UTF_8);
            return mapper.readValue(payload, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid token", ex);
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return ENCODER.encodeToString(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign token", ex);
        }
    }
}
