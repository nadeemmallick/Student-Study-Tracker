package com.studysync.service;

import com.studysync.dto.AssignmentRequest;
import com.studysync.dto.AssignmentResponse;
import com.studysync.entity.Assignment;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.repository.AssignmentRepository;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

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

    public AssignmentResponse createAssignment(AssignmentRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        if (!subject.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Subject does not belong to the user");
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
        return AssignmentResponse.fromEntity(saved);
    }

    public List<AssignmentResponse> getAssignmentsByUserId(Long userId) {
        return assignmentRepository.findByUser_UserIdOrderByDueDateAsc(userId).stream()
                .map(AssignmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public AssignmentResponse updateAssignment(Long assignmentId, AssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getUser().getUserId().equals(request.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        assignment.setSubject(subject);
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setPriority(request.getPriority());
        assignment.setStatus(request.getStatus());

        Assignment updated = assignmentRepository.save(assignment);
        return AssignmentResponse.fromEntity(updated);
    }

    public void deleteAssignment(Long assignmentId, Long userId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        assignmentRepository.delete(assignment);
    }
}
