package com.studyplatform.backend.controller;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.User;
import com.studyplatform.backend.repository.DocumentRepository;
import com.studyplatform.backend.repository.UserRepository;
import com.studyplatform.backend.service.FileService;
import com.studyplatform.backend.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileService fileService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AIService aiService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            User user = getCurrentUser();
            Document document = fileService.uploadFile(file, user);
            
            // Generate embeddings and chunk document synchronously for RAG
            try {
                aiService.chunkAndEmbedDocument(document);
            } catch (Exception e) {
                System.err.println("Embedding generation failed: " + e.getMessage());
            }

            return ResponseEntity.ok(document);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Document>> getUserFiles() {
        User user = getCurrentUser();
        List<Document> documents = documentRepository.findByUser(user);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/community")
    public ResponseEntity<List<Document>> getCommunityFiles() {
        List<Document> documents = documentRepository.findAll();
        return ResponseEntity.ok(documents);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
