package com.studysync.service;

import com.studysync.dto.SubjectRequest;
import com.studysync.dto.SubjectResponse;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.exception.ResourceNotFoundException;
import com.studysync.exception.UnauthorizedException;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * SubjectService – business logic for Subject management.
 *
 * Day 10: Replaced bare RuntimeException with typed exceptions
 *         (ResourceNotFoundException → 404, UnauthorizedException → 403).
 *         Added @Transactional and SLF4J logger.
 */
@Service
@SuppressWarnings("null")
public class SubjectService {

    private static final Logger log = LoggerFactory.getLogger(SubjectService.class);

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SubjectService(SubjectRepository subjectRepository, UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SubjectResponse createSubject(SubjectRequest request) {
        log.info("Creating subject for userId: {} — name: {}", request.getUserId(), request.getName());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Subject subject = Subject.builder()
                .name(request.getName())
                .description(request.getDescription())
                .colorCode(request.getColorCode())
                .user(user)
                .build();

        Subject saved = subjectRepository.save(subject);
        log.info("Subject created with id: {}", saved.getSubjectId());
        return SubjectResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByUserId(Long userId) {
        log.info("Fetching subjects for userId: {}", userId);
        return subjectRepository.findByUser_UserId(userId).stream()
                .map(SubjectResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubjectResponse updateSubject(Long subjectId, SubjectRequest request) {
        log.info("Updating subjectId: {} for userId: {}", subjectId, request.getUserId());

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        if (!subject.getUser().getUserId().equals(request.getUserId())) {
            throw new UnauthorizedException("Subject does not belong to this user");
        }

        subject.setName(request.getName());
        subject.setDescription(request.getDescription());
        subject.setColorCode(request.getColorCode());

        Subject saved = subjectRepository.save(subject);
        log.info("Subject updated: {}", saved.getSubjectId());
        return SubjectResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteSubject(Long subjectId, Long userId) {
        log.info("Deleting subjectId: {} for userId: {}", subjectId, userId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        if (!subject.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Subject does not belong to this user");
        }

        subjectRepository.delete(subject);
        log.info("Subject deleted: {}", subjectId);
    }
}
