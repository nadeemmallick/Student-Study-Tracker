package com.studysync.service;

import com.studysync.dto.StudySessionRequest;
import com.studysync.dto.StudySessionResponse;
import com.studysync.entity.StudySession;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.exception.ResourceNotFoundException;
import com.studysync.exception.UnauthorizedException;
import com.studysync.repository.StudySessionRepository;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * StudySessionService – business logic for Study Session management.
 *
 * Day 10: Added @Transactional, SLF4J logger, removed unused Duration import,
 *         and replaced bare RuntimeException with typed exceptions:
 *           ResourceNotFoundException → HTTP 404
 *           UnauthorizedException     → HTTP 403
 */
@Service
@SuppressWarnings("null")
public class StudySessionService {

    private static final Logger log = LoggerFactory.getLogger(StudySessionService.class);

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

    @Transactional
    public StudySessionResponse createSession(StudySessionRequest request) {
        log.info("Creating study session for userId: {} — date: {}", request.getUserId(), request.getDate());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));

        // Validate subject belongs to user
        if (!subject.getUser().getUserId().equals(user.getUserId())) {
            throw new UnauthorizedException("Subject does not belong to this user");
        }

        // Calculate duration in minutes; handle midnight crossover (e.g. 23:00 → 01:00)
        long minutes = ChronoUnit.MINUTES.between(request.getStartTime(), request.getEndTime());
        if (minutes < 0) {
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
        log.info("Study session created with id: {}", saved.getSessionId());
        return StudySessionResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<StudySessionResponse> getSessionsByUserId(Long userId) {
        log.info("Fetching study sessions for userId: {}", userId);
        return studySessionRepository.findByUser_UserIdOrderByDateDescStartTimeDesc(userId).stream()
                .map(StudySessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        log.info("Deleting sessionId: {} for userId: {}", sessionId, userId);

        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found with id: " + sessionId));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Study session does not belong to this user");
        }

        studySessionRepository.delete(session);
        log.info("Study session deleted: {}", sessionId);
    }
}
