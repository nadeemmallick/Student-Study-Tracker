package com.studysync.repository;

import com.studysync.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    
    // Find all subjects belonging to a specific user
    List<Subject> findByUser_UserId(Long userId);
    
}
