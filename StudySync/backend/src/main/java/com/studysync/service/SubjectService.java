package com.studysync.service;

import com.studysync.dto.SubjectRequest;
import com.studysync.dto.SubjectResponse;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {
    
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SubjectService(SubjectRepository subjectRepository, UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    public SubjectResponse createSubject(SubjectRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Subject subject = Subject.builder()
                .name(request.getName())
                .description(request.getDescription())
                .colorCode(request.getColorCode())
                .user(user)
                .build();

        Subject saved = subjectRepository.save(subject);
        return SubjectResponse.fromEntity(saved);
    }
    
    public List<SubjectResponse> getSubjectsByUserId(Long userId) {
        return subjectRepository.findByUser_UserId(userId).stream()
                .map(SubjectResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    public SubjectResponse updateSubject(Long subjectId, SubjectRequest request) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        // Only allow updating if it belongs to the user
        if (!subject.getUser().getUserId().equals(request.getUserId())) {
            throw new RuntimeException("Unauthorized");
        }

        subject.setName(request.getName());
        subject.setDescription(request.getDescription());
        subject.setColorCode(request.getColorCode());

        Subject saved = subjectRepository.save(subject);
        return SubjectResponse.fromEntity(saved);
    }
    
    public void deleteSubject(Long subjectId, Long userId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        if (!subject.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        subjectRepository.delete(subject);
    }
}
