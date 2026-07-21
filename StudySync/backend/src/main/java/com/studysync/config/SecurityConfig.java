package com.studysync.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security Configuration
 *
 * Day 1 Skeleton:
 *  - CORS configured for frontend (Live Server on port 5500)
 *  - Public routes: /api/auth/** (register, login)
 *  - All other routes require authentication
 *  - BCrypt password encoder registered
 *
 * Day 2: Wire UserDetailsService + AuthenticationProvider
 * Future: Add JWT filter here
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // ===== Public API Endpoints (no auth required) =====
    private static final String[] PUBLIC_URLS = {
            "/api/auth/register",
            "/api/auth/login",
            "/error"
    };

    /**
     * Main Security Filter Chain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (REST API – stateless)
            .csrf(csrf -> csrf.disable())

            // CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Session management – STATELESS for REST APIs
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(PUBLIC_URLS).permitAll()   // Allow register/login
                    .anyRequest().authenticated()               // Everything else requires login
            );

        // TODO Day 2: Add JWT authentication filter here
        // http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS Configuration
     * Allows frontend (VS Code Live Server on port 5500) to call the backend
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins (frontend URLs)
        config.setAllowedOrigins(List.of(
                "http://localhost:5500",      // VS Code Live Server
                "http://127.0.0.1:5500",     // VS Code Live Server (alternate)
                "http://localhost:3000",      // React (future use)
                "https://your-frontend.netlify.app"  // TODO: Replace with actual Netlify URL
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allowed headers
        config.setAllowedHeaders(List.of("*"));

        // Allow credentials (cookies/auth headers)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Password Encoder – BCrypt
     * Used to hash passwords before storing in DB
     * Used in: UserService.registerUser()
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
