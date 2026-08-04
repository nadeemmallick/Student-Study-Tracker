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

    /** Find a user by their email address (case-insensitive). */
    Optional<User> findByEmailIgnoreCase(String email);

    /** Find a user by their email address (exact match). */
    Optional<User> findByEmail(String email);

    /** Check if an email is already registered (case-insensitive). */
    boolean existsByEmailIgnoreCase(String email);

    /** Check if an email is already registered (exact match). */
    boolean existsByEmail(String email);
}
