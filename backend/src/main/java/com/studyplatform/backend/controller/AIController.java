package com.studyplatform.backend.controller;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.Flashcard;
import com.studyplatform.backend.entity.Question;
import com.studyplatform.backend.repository.DocumentRepository;
import com.studyplatform.backend.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @Autowired
    private DocumentRepository documentRepository;

    @PostMapping("/generate/{documentId}")
    public ResponseEntity<?> generateQuiz(@PathVariable Long documentId) {
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

            // 3. Call AIService to generate and save questions
            List<Question> questions = aiService.generateQuestions(documentId, content);

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
    public ResponseEntity<?> generateFlashcards(@PathVariable Long documentId) {
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

            List<Flashcard> flashcards = aiService.generateFlashcards(documentId, content);
            return ResponseEntity.ok(flashcards);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate flashcards: " + e.getMessage());
        }
    }
}
