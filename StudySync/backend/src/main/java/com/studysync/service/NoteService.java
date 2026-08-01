package com.studysync.service;

import com.studysync.dto.NoteRequest;
import com.studysync.dto.NoteResponse;
import com.studysync.entity.Note;
import com.studysync.entity.Subject;
import com.studysync.entity.User;
import com.studysync.exception.ResourceNotFoundException;
import com.studysync.exception.UnauthorizedException;
import com.studysync.repository.NoteRepository;
import com.studysync.repository.SubjectRepository;
import com.studysync.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class NoteService {

    private static final Logger log = LoggerFactory.getLogger(NoteService.class);

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    public NoteService(NoteRepository noteRepository, UserRepository userRepository, SubjectRepository subjectRepository) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
    }

    @Transactional
    public NoteResponse createNote(NoteRequest request) {
        log.info("Creating note for userId: {}", request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            if (!subject.getUser().getUserId().equals(user.getUserId())) {
                throw new UnauthorizedException("Subject does not belong to this user");
            }
        }

        Note note = Note.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        return NoteResponse.fromEntity(noteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getUserNotes(Long userId) {
        return noteRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream().map(NoteResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> searchNotes(Long userId, String query) {
        return noteRepository.findByUser_UserIdAndTitleContainingIgnoreCaseOrUser_UserIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
                userId, query, userId, query)
                .stream().map(NoteResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse updateNote(Long noteId, NoteRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        if (!note.getUser().getUserId().equals(request.getUserId())) {
            throw new UnauthorizedException("Note does not belong to this user");
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            if (!subject.getUser().getUserId().equals(request.getUserId())) {
                throw new UnauthorizedException("Subject does not belong to this user");
            }
        }

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        note.setSubject(subject);

        return NoteResponse.fromEntity(noteRepository.save(note));
    }

    @Transactional
    public void deleteNote(Long noteId, Long userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        if (!note.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Note does not belong to this user");
        }

        noteRepository.delete(note);
    }
}
