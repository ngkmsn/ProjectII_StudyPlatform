package com.studyplatform.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplatform.backend.entity.*;
import com.studyplatform.backend.repository.*;
import com.studyplatform.backend.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AIService aiService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/document/{documentId}")
    public ResponseEntity<?> getChatHistory(@PathVariable Long documentId) {
        try {
            User user = getCurrentUser();
            List<ChatHistory> history = chatHistoryRepository.findByUserIdAndDocumentIdOrderByCreatedAtAsc(user.getId(), documentId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error fetching chat history: " + e.getMessage());
        }
    }

    @PostMapping("/document")
    public ResponseEntity<?> chatWithDocument(@RequestBody Map<String, Object> payload) {
        try {
            User user = getCurrentUser();
            Long documentId = Long.valueOf(payload.get("documentId").toString());
            String message = payload.get("message").toString();

            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            // 1. Save user chat history
            ChatHistory userMsg = new ChatHistory(user, document, "USER", message, null);
            chatHistoryRepository.save(userMsg);

            // 2. Call RAG AI Service
            Map<String, Object> aiResponse = aiService.chatWithDocument(documentId, message);
            String answer = aiResponse.get("answer").toString();
            List<?> citationsList = (List<?>) aiResponse.get("citations");
            String citationsJson = objectMapper.writeValueAsString(citationsList);

            // 3. Save AI chat history
            ChatHistory aiMsg = new ChatHistory(user, document, "AI", answer, citationsJson);
            chatHistoryRepository.save(aiMsg);

            return ResponseEntity.ok(aiResponse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error chatting with document: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
