package com.studysync.repository;

import com.studysync.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    
    // Find all assignments for a user, ordered by due date (closest first)
    List<Assignment> findByUser_UserIdOrderByDueDateAsc(Long userId);
    
}
