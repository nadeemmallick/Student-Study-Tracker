package com.studysync.service;

import com.studysync.dto.AuthResponse;
import com.studysync.dto.LoginRequest;
import com.studysync.dto.RegisterRequest;
import com.studysync.entity.User;
import com.studysync.exception.InvalidCredentialsException;
import com.studysync.exception.UserAlreadyExistsException;
import com.studysync.repository.UserRepository;
import com.studysync.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * UserService – business logic for user registration and login.
 *
 * Day 10: Now injects JwtService to generate a signed JWT token on
 *         every successful register/login. The token is returned to
 *         the frontend inside AuthResponse.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService      = jwtService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse registerUser(RegisterRequest request) {

        // 1. Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(
                    "An account with email '" + request.getEmail() + "' already exists.");
        }

        // 2. Hash the password before saving – NEVER store plain text
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Build and save user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(hashedPassword)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: id={}, email={}", savedUser.getUserId(), savedUser.getEmail());

        // 4. Generate JWT for immediate login after registration
        String token = jwtService.generateToken(savedUser.getEmail(), savedUser.getUserId());

        // 5. Return response (never return the password hash)
        return AuthResponse.builder()
                .message("Registration successful")
                .userId(savedUser.getUserId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .token(token)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse loginUser(LoginRequest request) {

        // 1. Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // 2. Compare plain-text password against BCrypt hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        log.info("User logged in: id={}, email={}", user.getUserId(), user.getEmail());

        // 3. Generate JWT
        String token = jwtService.generateToken(user.getEmail(), user.getUserId());

        return AuthResponse.builder()
                .message("Login successful")
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .token(token)
                .build();
    }
}
