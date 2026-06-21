package com.studyplatform.backend.controller;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.Flashcard;
import com.studyplatform.backend.entity.Question;
import com.studyplatform.backend.entity.User;
import com.studyplatform.backend.repository.DocumentRepository;
import com.studyplatform.backend.repository.UserRepository;
import com.studyplatform.backend.repository.QuestionRepository;
import com.studyplatform.backend.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @PostMapping("/generate/{documentId}")
    public ResponseEntity<?> generateQuiz(
            @PathVariable Long documentId,
            @RequestBody(required = false) Map<String, Object> payload) {
        try {
            // 1. Get document from DB
            Optional<Document> documentOpt = documentRepository.findById(documentId);
            if (documentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found");
            }

            Document document = documentOpt.get();
            String content = document.getContent();

            // 2. Validate content
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Document content is empty. Cannot generate quiz.");
            }

            // Extract settings with default values
            String difficulty = "MEDIUM";
            List<String> questionTypes = List.of("MULTIPLE_CHOICE");
            Integer numQuestions = 5;
            String topic = null;

            if (payload != null) {
                if (payload.containsKey("difficulty")) {
                    difficulty = payload.get("difficulty").toString();
                }
                if (payload.containsKey("questionTypes")) {
                    questionTypes = (List<String>) payload.get("questionTypes");
                }
                if (payload.containsKey("numQuestions")) {
                    numQuestions = Integer.valueOf(payload.get("numQuestions").toString());
                }
                if (payload.containsKey("topic")) {
                    topic = payload.get("topic").toString();
                }
            }

            // 3. Call AIService to generate and save questions
            List<Question> questions = aiService.generateQuestions(documentId, content, difficulty, questionTypes, numQuestions, topic);

            // 4. Return questions
            return ResponseEntity.ok(questions);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate quiz: " + e.getMessage());
        }
    }

    @PostMapping("/generate-flashcards/{documentId}")
    public ResponseEntity<?> generateFlashcards(
            @PathVariable Long documentId,
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        try {
            Optional<Document> documentOpt = documentRepository.findById(documentId);
            if (documentOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found");
            }

            Document document = documentOpt.get();
            String content = document.getContent();

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Document content is empty. Cannot generate flashcards.");
            }

            String topic = null;
            if (payload != null && payload.containsKey("topic")) {
                topic = payload.get("topic");
            }

            List<Flashcard> flashcards = aiService.generateFlashcards(documentId, content, topic);
            return ResponseEntity.ok(flashcards);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate flashcards: " + e.getMessage());
        }
    }

    @GetMapping("/quizzes")
    public ResponseEntity<List<Document>> getUserQuizzes() {
        User user = getCurrentUser();
        List<Document> documents = documentRepository.findDocumentsWithQuizByUser(user);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/quiz/{documentId}")
    public ResponseEntity<?> getExistingQuiz(@PathVariable Long documentId) {
        List<Question> questions = questionRepository.findByDocumentId(documentId);
        return ResponseEntity.ok(questions);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
