package com.studysync.controller;

import com.studysync.dto.NoteRequest;
import com.studysync.dto.NoteResponse;
import com.studysync.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    private Long extractUserId(Authentication authentication) {
        return (Long) authentication.getDetails();
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(@Valid @RequestBody NoteRequest request, Authentication auth) {
        request.setUserId(extractUserId(auth));
        return new ResponseEntity<>(noteService.createNote(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<NoteResponse>> getUserNotes(Authentication auth) {
        return ResponseEntity.ok(noteService.getUserNotes(extractUserId(auth)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<NoteResponse>> searchNotes(@RequestParam String q, Authentication auth) {
        return ResponseEntity.ok(noteService.searchNotes(extractUserId(auth), q));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(@PathVariable Long id, @Valid @RequestBody NoteRequest request, Authentication auth) {
        request.setUserId(extractUserId(auth));
        return ResponseEntity.ok(noteService.updateNote(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id, Authentication auth) {
        noteService.deleteNote(id, extractUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
