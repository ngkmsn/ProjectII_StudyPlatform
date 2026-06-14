package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
}
