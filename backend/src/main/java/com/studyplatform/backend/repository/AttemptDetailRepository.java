package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.AttemptDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttemptDetailRepository extends JpaRepository<AttemptDetail, Long> {
    List<AttemptDetail> findByAttemptId(Long attemptId);
}
