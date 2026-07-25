package com.studysync.repository;

import com.studysync.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    
    // Find all sessions for a specific user, ordered chronologically (newest first)
    List<StudySession> findByUser_UserIdOrderByDateDescStartTimeDesc(Long userId);
    
}
