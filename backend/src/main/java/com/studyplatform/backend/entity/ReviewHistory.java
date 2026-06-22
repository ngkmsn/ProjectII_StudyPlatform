package com.studyplatform.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_history")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReviewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_item_id", nullable = false)
    private ReviewItem reviewItem;

    @Column(name = "quality_score", nullable = false)
    private Integer qualityScore;

    @Column(name = "previous_interval", nullable = false)
    private Integer previousInterval;

    @Column(name = "new_interval", nullable = false)
    private Integer newInterval;

    @CreationTimestamp
    @Column(name = "reviewed_at", updatable = false)
    private LocalDateTime reviewedAt;

    public ReviewHistory() {}

    public ReviewHistory(ReviewItem reviewItem, Integer qualityScore, Integer previousInterval, Integer newInterval) {
        this.reviewItem = reviewItem;
        this.qualityScore = qualityScore;
        this.previousInterval = previousInterval;
        this.newInterval = newInterval;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ReviewItem getReviewItem() { return reviewItem; }
    public void setReviewItem(ReviewItem reviewItem) { this.reviewItem = reviewItem; }

    public Integer getQualityScore() { return qualityScore; }
    public void setQualityScore(Integer qualityScore) { this.qualityScore = qualityScore; }

    public Integer getPreviousInterval() { return previousInterval; }
    public void setPreviousInterval(Integer previousInterval) { this.previousInterval = previousInterval; }

    public Integer getNewInterval() { return newInterval; }
    public void setNewInterval(Integer newInterval) { this.newInterval = newInterval; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
