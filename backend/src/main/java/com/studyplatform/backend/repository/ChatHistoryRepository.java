package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findByUserIdAndDocumentIdOrderByCreatedAtAsc(Long userId, Long documentId);
}
