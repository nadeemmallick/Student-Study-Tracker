package com.studysync.service;

import com.studysync.dto.AuthResponse;
import com.studysync.dto.LoginRequest;
import com.studysync.dto.PasswordChangeRequest;
import com.studysync.dto.ProfileResponse;
import com.studysync.dto.ProfileUpdateRequest;
import com.studysync.dto.RegisterRequest;
import com.studysync.entity.User;
import com.studysync.exception.InvalidCredentialsException;
import com.studysync.exception.ResourceNotFoundException;
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
@SuppressWarnings("null")
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

        // 1. Normalize email to lowercase to prevent case-sensitive duplicates
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        // 2. Check duplicate email (case-insensitive)
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new UserAlreadyExistsException(
                    "An account with email '" + normalizedEmail + "' already exists.");
        }

        // 3. Hash the password before saving – NEVER store plain text
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Build and save user
        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
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

        // 1. Find user by email (case-insensitive)
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
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

    // ─────────────────────────────────────────────────────────────────────────
    // GET PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new ProfileResponse(user.getUserId(), user.getName(), user.getEmail(), null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newEmail = request.getEmail().toLowerCase().trim();

        // If email is changing, check it's not taken by another user
        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            boolean taken = userRepository.findByEmailIgnoreCase(newEmail)
                    .map(u -> !u.getUserId().equals(userId))
                    .orElse(false);
            if (taken) {
                throw new UserAlreadyExistsException("Email '" + newEmail + "' is already in use.");
            }
        }

        user.setName(request.getName().trim());
        user.setEmail(newEmail);
        User saved = userRepository.save(user);

        log.info("Profile updated: userId={}", userId);
        return new ProfileResponse(saved.getUserId(), saved.getName(), saved.getEmail(), "Profile updated successfully");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

    public void changePassword(Long userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed: userId={}", userId);
    }
}
