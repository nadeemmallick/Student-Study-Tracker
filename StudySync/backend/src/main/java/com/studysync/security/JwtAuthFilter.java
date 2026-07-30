package com.studysync.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.List;

/**
 * JwtAuthFilter – Spring Security filter that validates the JWT on every request.
 *
 * Day 10: JWT Authentication
 *
 * Flow:
 *  1. Reads "Authorization: Bearer <token>" header.
 *  2. Validates the token via JwtService.
 *  3. Extracts email (principal) and userId (details) from the token claims.
 *  4. Sets the Authentication in SecurityContextHolder so downstream
 *     controllers can call authentication.getDetails() to get the userId
 *     without any extra DB query.
 *  5. If no valid token is present the filter chain continues; Spring
 *     Security will then reject the request if the route requires auth.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // No bearer token → skip (public routes or missing auth header)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7); // Strip "Bearer " prefix

        // Don't overwrite an existing authentication (e.g., from a previous filter)
        if (jwtService.isTokenValid(token)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String email  = jwtService.extractEmail(token);
            Long   userId = jwtService.extractUserId(token);

            // Build a stateless authentication object
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,                                          // principal = email
                            null,                                           // credentials (not needed post-auth)
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );

            // Attach userId as "details" – controllers read it via authentication.getDetails()
            authentication.setDetails(userId);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("JWT authenticated: userId={} email={}", userId, email);
        }

        filterChain.doFilter(request, response);
    }
}
