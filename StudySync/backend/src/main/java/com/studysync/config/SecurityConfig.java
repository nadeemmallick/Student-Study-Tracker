package com.studysync.config;

import com.studysync.security.JwtAuthFilter;
import com.studysync.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
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
 * Day 2 (done):
 *  - UserDetailsService wired → loads users from DB by email
 *  - DaoAuthenticationProvider wired → validates credentials against DB
 *
 * Day 10 (done):
 *  - JwtAuthFilter added – validates Bearer token on every request
 *  - Route protection restored: only /api/auth/** is open; all other
 *    /api/** routes require a valid JWT
 *  - Removed per-controller @CrossOrigin(*) – CORS handled here only
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthFilter          jwtAuthFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtAuthFilter jwtAuthFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthFilter      = jwtAuthFilter;
    }

    // ── Public routes (no JWT required) ──────────────────────────────────────
    private static final String[] PUBLIC_URLS = {
            "/api/auth/**",   // register and login
            "/error"
    };

    /**
     * Main Security Filter Chain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (REST API – stateless, JWT-based)
            .csrf(csrf -> csrf.disable())

            // CORS configuration (central – no per-controller @CrossOrigin needed)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Session management – STATELESS: JWT replaces server-side sessions
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(PUBLIC_URLS).permitAll()   // register / login
                    .anyRequest().authenticated()               // everything else requires JWT
            )

            // Wire DaoAuthenticationProvider (used for credential validation in UserService)
            .authenticationProvider(authenticationProvider())

            // Add JWT filter before Spring's username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION PROVIDER
    // Wires UserDetailsService + PasswordEncoder so Spring Security can
    // validate login credentials against the database.
    // ─────────────────────────────────────────────────────────────────────────
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * CORS Configuration
     * Allows frontend (VS Code Live Server on port 5500) to call the backend.
     * Specific origins are required when allowCredentials is true.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins (frontend URLs)
        config.setAllowedOrigins(List.of(
                "http://localhost:5500",      // VS Code Live Server
                "http://127.0.0.1:5500",     // VS Code Live Server (alternate)
                "http://localhost:3000"       // React (future use)
                // TODO: Add actual Netlify URL before deployment
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allowed headers – include Authorization for JWT
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));

        // Allow credentials (needed for Authorization header + specific origins)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Password Encoder – BCrypt
     * Used to hash passwords before storing in DB.
     * Used in: UserService.registerUser() and DaoAuthenticationProvider.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
