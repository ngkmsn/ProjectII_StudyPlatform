package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.ReviewItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewItemRepository extends JpaRepository<ReviewItem, Long> {
    List<ReviewItem> findByUserIdAndDueDateBefore(Long userId, LocalDateTime date);
    Optional<ReviewItem> findByUserIdAndFlashcardId(Long userId, Long flashcardId);
    Optional<ReviewItem> findByUserIdAndQuestionId(Long userId, Long questionId);
    List<ReviewItem> findByUserIdAndFlashcardDocumentId(Long userId, Long documentId);
}
