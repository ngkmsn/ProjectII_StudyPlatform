package com.studyplatform.backend.controller;

import com.studyplatform.backend.entity.*;
import com.studyplatform.backend.repository.*;
import com.studyplatform.backend.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AttemptDetailRepository attemptDetailRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private AIService aiService;

    @PostMapping("/adaptive")
    public ResponseEntity<?> generateAdaptiveQuiz(@RequestBody Map<String, Object> payload) {
        try {
            User user = getCurrentUser();
            Long documentId = Long.valueOf(payload.get("documentId").toString());
            String difficulty = payload.getOrDefault("difficulty", "MEDIUM").toString();

            // 1. Gather weak topics for this user on this document
            List<String> weakTopics = new ArrayList<>();
            List<String> pastMistakes = new ArrayList<>();

            if (payload.containsKey("topic")) {
                weakTopics.add(payload.get("topic").toString());
            } else if (payload.containsKey("topics")) {
                List<?> topicsList = (List<?>) payload.get("topics");
                for (Object t : topicsList) {
                    weakTopics.add(t.toString());
                }
            } else {
                List<Attempt> attempts = attemptRepository.findByUserIdAndDocumentId(user.getId(), documentId);
                Map<String, Integer> wrongCount = new HashMap<>();
                
                for (Attempt att : attempts) {
                    List<AttemptDetail> details = attemptDetailRepository.findByAttemptId(att.getId());
                    for (AttemptDetail detail : details) {
                        if (Boolean.FALSE.equals(detail.getCorrect())) {
                            Question q = detail.getQuestion();
                            pastMistakes.add(q.getQuestionText());
                            if (q.getTopic() != null) {
                                String topicTitle = q.getTopic().getTitle();
                                wrongCount.put(topicTitle, wrongCount.getOrDefault(topicTitle, 0) + 1);
                            }
                        }
                    }
                }

                // Get top 3 wrong topics as weak topics
                wrongCount.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .limit(3)
                        .forEach(entry -> weakTopics.add(entry.getKey()));

                if (weakTopics.isEmpty()) {
                    // Fallback: pick any 2 topics from the document if available
                    List<Topic> docTopics = topicRepository.findByDocumentId(documentId);
                    for (int i = 0; i < Math.min(2, docTopics.size()); i++) {
                        weakTopics.add(docTopics.get(i).getTitle());
                    }
                }
            }

            // 2. Call AIService to generate adaptive quiz
            List<Question> questions = aiService.generateAdaptiveQuiz(documentId, weakTopics, difficulty, pastMistakes);
            return ResponseEntity.ok(questions);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generating adaptive quiz: " + e.getMessage());
        }
    }

    @GetMapping("/weak-topics")
    public ResponseEntity<?> getWeakTopics() {
        try {
            User user = getCurrentUser();
            List<Attempt> attempts = attemptRepository.findByUserId(user.getId());
            
            Map<Long, TopicStats> statsMap = new HashMap<>();
            
            for (Attempt att : attempts) {
                List<AttemptDetail> details = attemptDetailRepository.findByAttemptId(att.getId());
                for (AttemptDetail detail : details) {
                    Question q = detail.getQuestion();
                    if (q.getTopic() != null) {
                        Topic topic = q.getTopic();
                        TopicStats stats = statsMap.computeIfAbsent(topic.getId(), id -> new TopicStats(topic));
                        stats.totalAttempts++;
                        if (Boolean.TRUE.equals(detail.getCorrect())) {
                            stats.correctAttempts++;
                        }
                    }
                }
            }

            List<Map<String, Object>> weakTopics = new ArrayList<>();
            for (TopicStats stats : statsMap.values()) {
                double accuracy = stats.getAccuracy();
                // If accuracy is below 70% and there was at least one attempt, it's a weak topic
                if (accuracy < 0.7 && stats.totalAttempts > 0) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("topicId", stats.topic.getId());
                    map.put("title", stats.topic.getTitle());
                    map.put("description", stats.topic.getDescription());
                    map.put("accuracy", accuracy);
                    map.put("totalAttempts", stats.totalAttempts);
                    map.put("documentId", stats.topic.getDocument().getId());
                    map.put("documentName", stats.topic.getDocument().getFileName());
                    weakTopics.add(map);
                }
            }

            // Sort by accuracy ascending
            weakTopics.sort((a, b) -> Double.compare((Double) a.get("accuracy"), (Double) b.get("accuracy")));

            return ResponseEntity.ok(weakTopics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error calculating weak topics: " + e.getMessage());
        }
    }

    @GetMapping("/attempts")
    public ResponseEntity<?> getAttempts() {
        try {
            User user = getCurrentUser();
            List<Attempt> attempts = attemptRepository.findByUserId(user.getId());
            attempts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

            List<Map<String, Object>> result = new ArrayList<>();
            for (Attempt a : attempts) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("score", a.getScore());
                map.put("createdAt", a.getCreatedAt());
                if (a.getDocument() != null) {
                    Map<String, Object> docMap = new HashMap<>();
                    docMap.put("id", a.getDocument().getId());
                    docMap.put("fileName", a.getDocument().getFileName());
                    map.put("document", docMap);
                } else {
                    map.put("document", null);
                }
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching attempts: " + e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody Map<String, Object> payload) {
        try {
            User user = getCurrentUser();
            Long documentId = Long.valueOf(payload.get("documentId").toString());
            int score = Integer.parseInt(payload.get("score").toString());
            Map<?, ?> answersMap = (Map<?, ?>) payload.get("answers");

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            // 1. Create Attempt
            Attempt attempt = new Attempt(user, document, score);
            attempt = attemptRepository.save(attempt);

            // 2. Create AttemptDetails
            for (Map.Entry<?, ?> entry : answersMap.entrySet()) {
                Long questionId = Long.valueOf(entry.getKey().toString());
                String userResponse = entry.getValue().toString();

                Question question = questionRepository.findById(questionId)
                        .orElseThrow(() -> new IllegalArgumentException("Question not found"));

                boolean isCorrect = false;
                Answer selectedAnswer = null;

                if ("FILL_IN_BLANK".equalsIgnoreCase(question.getType()) || "SHORT_ANSWER".equalsIgnoreCase(question.getType())) {
                    List<Answer> answers = question.getAnswers();
                    if (answers != null && !answers.isEmpty()) {
                        selectedAnswer = answers.get(0);
                        if (userResponse != null && selectedAnswer != null) {
                            String correctText = selectedAnswer.getAnswerText().trim();
                            String userText = userResponse.trim();
                            isCorrect = userText.equalsIgnoreCase(correctText);
                        }
                    }
                } else {
                    try {
                        Long selectedAnswerId = Long.valueOf(userResponse);
                        selectedAnswer = answerRepository.findById(selectedAnswerId)
                                .orElseThrow(() -> new IllegalArgumentException("Answer not found"));
                        isCorrect = selectedAnswer.isCorrect();
                    } catch (NumberFormatException e) {
                        isCorrect = false;
                    }
                }

                if (selectedAnswer != null) {
                    AttemptDetail detail = new AttemptDetail(attempt, question, selectedAnswer, isCorrect);
                    attemptDetailRepository.save(detail);

                    // Dynamically update topic mastery level based on correct/wrong answers
                    Topic topic = question.getTopic();
                    if (topic != null) {
                        double delta = isCorrect ? 0.05 : -0.05;
                        double newMastery = Math.min(1.0, Math.max(0.0, topic.getMasteryLevel() + delta));
                        topic.setMasteryLevel(newMastery);
                        topicRepository.save(topic);
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("attemptId", attempt.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error submitting quiz: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private static class TopicStats {
        Topic topic;
        int totalAttempts = 0;
        int correctAttempts = 0;

        TopicStats(Topic topic) {
            this.topic = topic;
        }

        double getAccuracy() {
            if (totalAttempts == 0) return 0.0;
            return (double) correctAttempts / totalAttempts;
        }
    }
}
