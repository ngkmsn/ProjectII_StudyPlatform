package com.studyplatform.backend.controller;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.Topic;
import com.studyplatform.backend.entity.User;
import com.studyplatform.backend.repository.DocumentRepository;
import com.studyplatform.backend.repository.TopicRepository;
import com.studyplatform.backend.repository.UserRepository;
import com.studyplatform.backend.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AIService aiService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/document/{documentId}")
    public ResponseEntity<?> getDocumentTopics(@PathVariable Long documentId) {
        try {
            List<Topic> topics = topicRepository.findByDocumentId(documentId);
            if (topics.isEmpty()) {
                // Auto generate topics if empty
                Document document = documentRepository.findById(documentId)
                        .orElseThrow(() -> new IllegalArgumentException("Document not found"));
                topics = aiService.generateTopics(documentId, document.getContent());
            }
            return ResponseEntity.ok(topics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching topics: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<?> getTopicProgress(@PathVariable Long id) {
        try {
            Topic topic = topicRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Topic not found"));
            
            // Return mastery level (0.0 to 1.0)
            Map<String, Object> progress = new HashMap<>();
            progress.put("topicId", id);
            progress.put("title", topic.getTitle());
            progress.put("masteryLevel", topic.getMasteryLevel());
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error fetching progress: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
