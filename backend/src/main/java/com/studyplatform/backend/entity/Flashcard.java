package com.studyplatform.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long documentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(name = "card_type", nullable = true)
    private String cardType = "QA"; // Default card type

    @Column(name = "front_text", nullable = false, columnDefinition = "TEXT")
    private String frontContent;

    @Column(name = "back_text", nullable = false, columnDefinition = "TEXT")
    private String backContent;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Flashcard() {}

    public Flashcard(Long documentId, Topic topic, String cardType, String frontContent, String backContent) {
        this.documentId = documentId;
        this.topic = topic;
        this.cardType = cardType;
        this.frontContent = frontContent;
        this.backContent = backContent;
    }

    // Keep compatibility constructors if any
    public Flashcard(Long documentId, String frontContent, String backContent) {
        this.documentId = documentId;
        this.frontContent = frontContent;
        this.backContent = backContent;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public Topic getTopic() { return topic; }
    public void setTopic(Topic topic) { this.topic = topic; }

    public String getCardType() { return cardType; }
    public void setCardType(String cardType) { this.cardType = cardType; }

    public String getFrontContent() { return frontContent; }
    public void setFrontContent(String frontContent) { this.frontContent = frontContent; }

    public String getBackContent() { return backContent; }
    public void setBackContent(String backContent) { this.backContent = backContent; }

    // Compatibility getters/setters
    public String getFrontText() { return frontContent; }
    public void setFrontText(String frontText) { this.frontContent = frontText; }
    public String getBackText() { return backContent; }
    public void setBackText(String backText) { this.backContent = backText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
