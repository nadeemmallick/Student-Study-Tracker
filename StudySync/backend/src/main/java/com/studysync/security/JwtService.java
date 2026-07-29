package com.studysync.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JwtService – generates, validates, and parses JWT tokens.
 *
 * Day 10: JWT Authentication
 *
 * Token structure:
 *   header.payload.signature
 *   payload claims: { sub: email, userId: Long, iat: ..., exp: ... }
 *
 * Secret and expiry are read from application.properties:
 *   app.jwt.secret        – Base64-encoded HMAC-SHA256 key (≥ 256 bits)
 *   app.jwt.expiration-ms – token lifetime in milliseconds (default: 7 days)
 */
@Component
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    // ── Key ──────────────────────────────────────────────────────────────────

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── Generate ─────────────────────────────────────────────────────────────

    /**
     * Generates a signed JWT for the given user.
     *
     * @param email  the user's email (stored as JWT subject)
     * @param userId the user's database ID (stored as custom claim)
     * @return compact JWT string: "xxxxx.yyyyy.zzzzz"
     */
    public String generateToken(String email, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        String token = Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();

        log.debug("JWT generated for userId={} ({}), expires in {}ms", userId, email, jwtExpirationMs);
        return token;
    }

    // ── Extract ───────────────────────────────────────────────────────────────

    /**
     * Extracts the email (subject) from a valid token.
     */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extracts the userId claim from a valid token.
     * JSON numbers deserialise as Integer if they fit; cast to Long safely.
     */
    public Long extractUserId(String token) {
        Object userId = parseClaims(token).get("userId");
        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        }
        return (Long) userId;
    }

    // ── Validate ──────────────────────────────────────────────────────────────

    /**
     * Returns true if the token signature is valid and the token has not expired.
     */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
        }
        return false;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
