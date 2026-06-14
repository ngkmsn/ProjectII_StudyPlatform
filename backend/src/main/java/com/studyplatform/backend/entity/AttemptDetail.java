package com.studyplatform.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "attempt_details")
public class AttemptDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "selected_answer_id")
    private Answer selectedAnswer;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    public AttemptDetail() {}

    public AttemptDetail(Attempt attempt, Question question, Answer selectedAnswer, Boolean isCorrect) {
        this.attempt = attempt;
        this.question = question;
        this.selectedAnswer = selectedAnswer;
        this.isCorrect = isCorrect;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Attempt getAttempt() { return attempt; }
    public void setAttempt(Attempt attempt) { this.attempt = attempt; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public Answer getSelectedAnswer() { return selectedAnswer; }
    public void setSelectedAnswer(Answer selectedAnswer) { this.selectedAnswer = selectedAnswer; }

    public Boolean getCorrect() { return isCorrect; }
    public void setCorrect(Boolean correct) { isCorrect = correct; }
}
