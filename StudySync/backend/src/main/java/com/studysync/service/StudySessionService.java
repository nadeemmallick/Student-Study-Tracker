package com.studysync.service;

import com.studysync.dto.StudySessionRequest;
import com.studysync.dto.StudySessionResponse;
import com.studysync.entity.StudySession;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.repository.StudySessionRepository;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    public StudySessionService(StudySessionRepository studySessionRepository, 
                               UserRepository userRepository, 
                               SubjectRepository subjectRepository) {
        this.studySessionRepository = studySessionRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
    }

    public StudySessionResponse createSession(StudySessionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        // Validate Subject belongs to User
        if (!subject.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Subject does not belong to the user");
        }

        // Calculate Duration in minutes
        long minutes = java.time.temporal.ChronoUnit.MINUTES.between(request.getStartTime(), request.getEndTime());
        if (minutes < 0) {
            // Handle midnight crossover (e.g. 23:00 to 01:00 = -1320 + 1440 = 120 minutes)
            minutes += 24 * 60;
        }

        StudySession session = StudySession.builder()
                .user(user)
                .subject(subject)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes((int) minutes)
                .notes(request.getNotes())
                .build();

        StudySession saved = studySessionRepository.save(session);
        return StudySessionResponse.fromEntity(saved);
    }

    public List<StudySessionResponse> getSessionsByUserId(Long userId) {
        return studySessionRepository.findByUser_UserIdOrderByDateDescStartTimeDesc(userId).stream()
                .map(StudySessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public void deleteSession(Long sessionId, Long userId) {
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        studySessionRepository.delete(session);
    }
}
