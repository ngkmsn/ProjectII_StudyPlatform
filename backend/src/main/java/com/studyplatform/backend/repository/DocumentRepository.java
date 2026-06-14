package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUser(User user);

    @Query("SELECT DISTINCT d FROM Document d WHERE d.user = :user AND EXISTS (SELECT q FROM Question q WHERE q.documentId = d.id)")
    List<Document> findDocumentsWithQuizByUser(@Param("user") User user);
}
