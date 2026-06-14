package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, Long> {
    List<Attempt> findByUserId(Long userId);
    List<Attempt> findByUserIdAndDocumentId(Long userId, Long documentId);
}
