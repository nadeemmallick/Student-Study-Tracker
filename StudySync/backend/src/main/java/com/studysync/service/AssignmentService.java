package com.studysync.service;

import com.studysync.dto.AssignmentRequest;
import com.studysync.dto.AssignmentResponse;
import com.studysync.entity.Assignment;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.exception.ResourceNotFoundException;
import com.studysync.exception.UnauthorizedException;
import com.studysync.repository.AssignmentRepository;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AssignmentService – business logic for Assignment management.
 *
 * Day 10: Added @Transactional, SLF4J logger, and replaced bare
 *         RuntimeException with typed exceptions:
 *           ResourceNotFoundException → HTTP 404
 *           UnauthorizedException     → HTTP 403
 */
@Service
@SuppressWarnings("null")
public class AssignmentService {

    private static final Logger log = LoggerFactory.getLogger(AssignmentService.class);

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             UserRepository userRepository,
                             SubjectRepository subjectRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
    }

    @Transactional
    public AssignmentResponse createAssignment(AssignmentRequest request) {
        log.info("Creating assignment for userId: {} — title: {}", request.getUserId(), request.getTitle());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));

        if (!subject.getUser().getUserId().equals(user.getUserId())) {
            throw new UnauthorizedException("Subject does not belong to this user");
        }

        Assignment assignment = Assignment.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .priority(request.getPriority())
                .status(request.getStatus())
                .build();

        Assignment saved = assignmentRepository.save(assignment);
        log.info("Assignment created with id: {}", saved.getAssignmentId());
        return AssignmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsByUserId(Long userId) {
        log.info("Fetching assignments for userId: {}", userId);
        return assignmentRepository.findByUser_UserIdOrderByDueDateAsc(userId).stream()
                .map(AssignmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentResponse updateAssignment(Long assignmentId, AssignmentRequest request) {
        log.info("Updating assignmentId: {} for userId: {}", assignmentId, request.getUserId());

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (!assignment.getUser().getUserId().equals(request.getUserId())) {
            throw new UnauthorizedException("Assignment does not belong to this user");
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));

        assignment.setSubject(subject);
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setPriority(request.getPriority());
        assignment.setStatus(request.getStatus());

        Assignment updated = assignmentRepository.save(assignment);
        log.info("Assignment updated: {}", updated.getAssignmentId());
        return AssignmentResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteAssignment(Long assignmentId, Long userId) {
        log.info("Deleting assignmentId: {} for userId: {}", assignmentId, userId);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (!assignment.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Assignment does not belong to this user");
        }

        assignmentRepository.delete(assignment);
        log.info("Assignment deleted: {}", assignmentId);
    }
}
