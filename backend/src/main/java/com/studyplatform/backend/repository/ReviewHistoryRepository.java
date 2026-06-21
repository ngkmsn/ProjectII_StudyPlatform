package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    @Query(
        "SELECT CAST(rh.reviewedAt AS date) as day, COUNT(rh) as cnt FROM ReviewHistory rh " +
        "WHERE rh.reviewItem.user.id = :userId " +
        "GROUP BY CAST(rh.reviewedAt AS date) " +
        "ORDER BY CAST(rh.reviewedAt AS date) ASC"
    )
    List<Object[]> getReviewCountGroupByDay(@Param("userId") Long userId);
}
