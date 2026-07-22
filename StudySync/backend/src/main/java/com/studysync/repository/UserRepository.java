package com.studysync.repository;

import com.studysync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository
 * Spring Data JPA automatically implements CRUD + custom queries.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Find a user by their email address (used for login + UserDetailsService). */
    Optional<User> findByEmail(String email);

    /** Check if an email is already registered (used during registration). */
    boolean existsByEmail(String email);
}
