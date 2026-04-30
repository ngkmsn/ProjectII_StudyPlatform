package com.studyplatform.backend.service;

import com.studyplatform.backend.entity.Document;
import com.studyplatform.backend.entity.User;
import com.studyplatform.backend.repository.DocumentRepository;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service.role.key}")
    private String serviceRoleKey;

    @Value("${supabase.bucket.name}")
    private String bucketName;

    private final Tika tika = new Tika();

    public Document uploadFile(MultipartFile file, User user) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        String uniqueFileName = UUID.randomUUID().toString() + extension;
        String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucketName, uniqueFileName);

        String extractedContent = "";
        try {
            extractedContent = tika.parseToString(file.getInputStream());
        } catch (Exception e) {
            System.err.println("Could not extract text from file: " + e.getMessage());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

        ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        if (response.getStatusCode().is2xxSuccessful()) {
            String fileUrl = String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucketName, uniqueFileName);

            Document document = new Document();
            document.setUser(user);
            document.setFileName(originalFileName);
            document.setFileUrl(fileUrl);
            document.setContent(extractedContent);

            return documentRepository.save(document);
        } else {
            throw new RuntimeException("Failed to upload file to Supabase Storage: " + response.getBody());
        }
    }
}
