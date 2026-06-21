package com.studyplatform.backend;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.DocumentChunk;
import com.studyplatform.backend.repository.DocumentRepository;
import com.studyplatform.backend.repository.DocumentChunkRepository;
import com.studyplatform.backend.service.AIService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AIServiceTest {

    @Autowired
    private AIService aiService;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;



    @Test
    public void testGeminiEmbeddingWorks() {
        System.out.println("========== TESTING GEMINI EMBEDDING API ==========");
        String testText = "LearnHub là nền tảng học tập thông minh";
        List<Double> embedding = aiService.getEmbedding(testText);
        
        assertNotNull(embedding, "Embedding should not be null");
        assertEquals(768, embedding.size(), "Gemini embedding should return a 768-dimensional vector");
        
        // Let's verify it is not the zero vector fallback
        double sum = 0.0;
        for (Double val : embedding) {
            sum += Math.abs(val);
        }
        
        System.out.println("Embedding size: " + embedding.size());
        System.out.println("Embedding absolute sum: " + sum);
        assertNotEquals(0.0, sum, "Embedding should not be a fallback zero-vector!");
        System.out.println("Gemini Embedding API works perfectly!");
    }

    @Test
    public void testChatWithDocument() {
        System.out.println("========== TESTING RAG CHAT WITH DOCUMENT ==========");
        List<Document> documents = documentRepository.findAll();
        System.out.println("Total documents in database: " + documents.size());
        System.out.println("Total document chunks in database: " + documentChunkRepository.count());
        
        if (documents.isEmpty()) {
            System.out.println("No documents found in database. Skipping RAG chat simulation.");
            return;
        }
        
        for (Document doc : documents) {
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(doc.getId());
            System.out.println(String.format("- Doc ID: %d, Name: %s, Length: %d chars, Chunks Count: %d", 
                doc.getId(), doc.getFileName(), 
                doc.getContent() != null ? doc.getContent().length() : 0,
                chunks.size()
            ));
        }

        // Find a document with both content AND chunks
        Document testDoc = null;
        int testDocChunkCount = 0;
        for (Document doc : documents) {
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(doc.getId());
            if (chunks.size() > 0) {
                testDoc = doc;
                testDocChunkCount = chunks.size();
                break;
            }
        }
        
        if (testDoc == null) {
            System.out.println("No documents with existing chunks found. We will generate chunks for the first document.");
            for (Document doc : documents) {
                if (doc.getContent() != null && doc.getContent().length() > 100) {
                    testDoc = doc;
                    break;
                }
            }
            if (testDoc == null) {
                testDoc = documents.get(0);
            }
            
            // Try to chunk and embed
            System.out.println("Generating chunks & embeddings for: " + testDoc.getFileName());
            aiService.chunkAndEmbedDocument(testDoc);
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(testDoc.getId());
            testDocChunkCount = chunks.size();
            System.out.println("Generated chunks count: " + testDocChunkCount);
        }

        System.out.println("Testing RAG Chat with Document: " + testDoc.getFileName() + " (Chunks Count: " + testDocChunkCount + ")");

        Map<String, Object> result = aiService.chatWithDocument(testDoc.getId(), "Tìm hiểu các thông tin chính trong tài liệu này?");
        
        assertNotNull(result, "Chat result should not be null");
        String answer = (String) result.get("answer");
        List<?> citations = (List<?>) result.get("citations");
        
        System.out.println("AI Answer: \n" + answer);
        System.out.println("Citations count: " + (citations != null ? citations.size() : 0));
        if (citations != null) {
            for (Object cit : citations) {
                System.out.println("Citation: " + cit);
            }
        }
        
        assertNotNull(answer);
        assertNotEquals("Không thể kết nối với AI vào lúc này.", answer);
        
        if (testDocChunkCount > 0) {
            assertTrue(citations != null && citations.size() > 0, "Should return citations when chunks exist!");
        }
        
        System.out.println("RAG Chat works perfectly!");
    }
}
