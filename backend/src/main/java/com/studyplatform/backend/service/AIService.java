package com.studyplatform.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplatform.backend.entity.Answer;
import com.studyplatform.backend.entity.Flashcard;
import com.studyplatform.backend.entity.Question;
import com.studyplatform.backend.repository.AnswerRepository;
import com.studyplatform.backend.repository.FlashcardRepository;
import com.studyplatform.backend.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ai.api.key}")
    private String aiApiKey;

    @Value("${ai.api.url}")
    private String aiApiUrl;

    @Value("${ai.model}")
    private String aiModel;

    private static final int MAX_CONTENT_LENGTH = 4000;

    public List<Question> generateQuestions(Long documentId, String content) throws Exception {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Content cannot be empty");
        }

        String truncatedContent = content.length() > MAX_CONTENT_LENGTH 
                ? content.substring(0, MAX_CONTENT_LENGTH) 
                : content;

        String prompt = String.format(
            "Bạn là một trợ lý học tập AI chuyên nghiệp. Dựa trên nội dung học tập sau đây: \n\n%s\n\n" +
            "Hãy tạo ra 5 câu hỏi trắc nghiệm bằng TIẾNG VIỆT. Mỗi câu hỏi phải bao gồm: \n" +
            "* question: nội dung câu hỏi\n" +
            "* options: 4 lựa chọn trả lời\n" +
            "* correct_answer: đáp án đúng (phải khớp chính xác với một trong các lựa chọn)\n" +
            "* explanation: giải thích chi tiết tại sao đáp án đó đúng\n\n" +
            "Chỉ trả về duy nhất một đối tượng JSON theo định dạng sau:\n" +
            "{\"questions\": [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct_answer\": \"A\", \"explanation\": \"...\"}]}",
            truncatedContent
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Google Gemini Request Structure
        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentNode = new HashMap<>();
        List<Map<String, String>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));
        contentNode.put("parts", parts);
        contents.add(contentNode);
        body.put("contents", contents);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String finalUrl = aiApiUrl + "?key=" + aiApiKey;
        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return parseAndSaveQuestions(documentId, response.getBody());
        } else {
            throw new RuntimeException("Gemini API failed: " + response.getStatusCode() + " - " + response.getBody());
        }
    }

    public List<Flashcard> generateFlashcards(Long documentId, String content) throws Exception {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Content cannot be empty");
        }

        String truncatedContent = content.length() > MAX_CONTENT_LENGTH 
                ? content.substring(0, MAX_CONTENT_LENGTH) 
                : content;

        String prompt = String.format(
            "Bạn là một trợ lý học tập AI chuyên nghiệp. Dựa trên nội dung sau: \n\n%s\n\n" +
            "Hãy tạo ra 10 bộ Flashcards bằng TIẾNG VIỆT để giúp người dùng ghi nhớ kiến thức cốt lõi. \n" +
            "Mỗi flashcard gồm:\n" +
            "* front: Câu hỏi hoặc khái niệm ngắn gọn\n" +
            "* back: Câu trả lời hoặc định nghĩa đầy đủ\n\n" +
            "Chỉ trả về duy nhất một đối tượng JSON theo định dạng:\n" +
            "{\"flashcards\": [{\"front\": \"...\", \"back\": \"...\"}]}",
            truncatedContent
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentNode = new HashMap<>();
        List<Map<String, String>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));
        contentNode.put("parts", parts);
        contents.add(contentNode);
        body.put("contents", contents);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String finalUrl = aiApiUrl + "?key=" + aiApiKey;
        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String jsonContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            if (jsonContent.contains("```json")) {
                jsonContent = jsonContent.substring(jsonContent.indexOf("```json") + 7, jsonContent.lastIndexOf("```"));
            } else if (jsonContent.contains("```")) {
                jsonContent = jsonContent.substring(jsonContent.indexOf("```") + 3, jsonContent.lastIndexOf("```"));
            }

            JsonNode flashcardsNode = objectMapper.readTree(jsonContent).path("flashcards");
            List<Flashcard> savedFlashcards = new ArrayList<>();

            for (JsonNode fNode : flashcardsNode) {
                Flashcard flashcard = new Flashcard(documentId, fNode.path("front").asText(), fNode.path("back").asText());
                savedFlashcards.add(flashcardRepository.save(flashcard));
            }
            return savedFlashcards;
        } else {
            throw new RuntimeException("Gemini API failed: " + response.getStatusCode());
        }
    }

    private List<Question> parseAndSaveQuestions(Long documentId, String aiResponseBody) throws Exception {
        JsonNode root = objectMapper.readTree(aiResponseBody);
        
        // Gemini Response Structure: candidates[0].content.parts[0].text
        String jsonContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        
        // Sometimes AI wraps JSON in markdown blocks
        if (jsonContent.contains("```json")) {
            jsonContent = jsonContent.substring(jsonContent.indexOf("```json") + 7, jsonContent.lastIndexOf("```"));
        } else if (jsonContent.contains("```")) {
            jsonContent = jsonContent.substring(jsonContent.indexOf("```") + 3, jsonContent.lastIndexOf("```"));
        }

        JsonNode questionsNode = objectMapper.readTree(jsonContent).path("questions");
        List<Question> savedQuestions = new ArrayList<>();

        for (JsonNode qNode : questionsNode) {
            // Save Question
            Question question = new Question();
            question.setDocumentId(documentId);
            question.setQuestionText(qNode.path("question").asText());
            question.setExplanation(qNode.path("explanation").asText());
            question = questionRepository.save(question);

            // Save Answers
            List<Answer> answers = new ArrayList<>();
            JsonNode options = qNode.path("options");
            String correctAnswer = qNode.path("correct_answer").asText();

            for (JsonNode option : options) {
                String optionText = option.asText();
                boolean isCorrect = optionText.equals(correctAnswer);
                Answer answer = new Answer(question, optionText, isCorrect);
                answers.add(answerRepository.save(answer));
            }
            
            question.setAnswers(answers);
            savedQuestions.add(question);
        }

        return savedQuestions;
    }
}
