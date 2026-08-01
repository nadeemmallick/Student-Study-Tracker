package com.studysync.repository;

import com.studysync.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    List<Note> findByUser_UserIdAndTitleContainingIgnoreCaseOrUser_UserIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
            Long userId1, String titleQuery, Long userId2, String contentQuery);
}
