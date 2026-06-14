package com.studyplatform.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplatform.backend.entity.*;
import com.studyplatform.backend.repository.*;
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
    private TopicRepository topicRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private DocumentRepository documentRepository;

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

    // ==========================================
    // EMBEDDINGS & RAG
    // ==========================================

    public List<Double> getEmbedding(String text) {
        try {
            String embedUrl = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" + aiApiKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> contentNode = Map.of("parts", List.of(Map.of("text", text)));
            Map<String, Object> body = Map.of(
                "model", "models/text-embedding-004",
                "content", contentNode
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(embedUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode valuesNode = root.path("embedding").path("values");
                List<Double> embedding = new ArrayList<>();
                for (JsonNode val : valuesNode) {
                    embedding.add(val.asDouble());
                }
                return embedding;
            } else {
                throw new RuntimeException("Embedding creation failed: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Embedding extraction error: " + e.getMessage());
            List<Double> fallback = new ArrayList<>();
            for (int i = 0; i < 1536; i++) fallback.add(0.0);
            return fallback;
        }
    }

    public void chunkAndEmbedDocument(Document document) {
        String content = document.getContent();
        if (content == null || content.trim().isEmpty()) return;

        int chunkSize = 1000;
        int overlap = 200;
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < content.length()) {
            int end = Math.min(start + chunkSize, content.length());
            chunks.add(content.substring(start, end));
            start += chunkSize - overlap;
        }

        for (int i = 0; i < chunks.size(); i++) {
            String chunkText = chunks.get(i);
            List<Double> embedding = getEmbedding(chunkText);
            String embeddingStr = embedding.toString();

            DocumentChunk dbChunk = new DocumentChunk(document, i, chunkText, embeddingStr, 1);
            documentChunkRepository.save(dbChunk);
        }
    }

    public String getRagContext(Long documentId, String query) {
        List<Double> queryEmbedding = getEmbedding(query);
        String queryEmbeddingStr = queryEmbedding.toString();

        List<DocumentChunk> matchingChunks = documentChunkRepository.findSimilarChunks(documentId, queryEmbeddingStr, 3);
        StringBuilder context = new StringBuilder();
        for (DocumentChunk chunk : matchingChunks) {
            context.append(chunk.getContent()).append("\n\n");
        }
        return context.toString();
    }

    public Map<String, Object> chatWithDocument(Long documentId, String query) {
        List<Double> queryEmbedding = getEmbedding(query);
        String queryEmbeddingStr = queryEmbedding.toString();

        List<DocumentChunk> matchingChunks = documentChunkRepository.findSimilarChunks(documentId, queryEmbeddingStr, 3);
        StringBuilder context = new StringBuilder();
        List<Map<String, Object>> citations = new ArrayList<>();
        
        for (DocumentChunk chunk : matchingChunks) {
            context.append(chunk.getContent()).append("\n\n");
            Map<String, Object> citation = new HashMap<>();
            citation.put("chunkId", chunk.getId());
            citation.put("chunkIndex", chunk.getChunkIndex());
            String snippet = chunk.getContent();
            if (snippet.length() > 120) {
                snippet = snippet.substring(0, 120) + "...";
            }
            citation.put("snippet", snippet);
            citation.put("pageNumber", chunk.getPageNumber());
            citations.add(citation);
        }

        String prompt = String.format(
            "Bạn là một trợ lý học tập AI. Bạn có quyền truy cập vào các đoạn nội dung trích xuất từ tài liệu học tập của học viên như sau:\n\n" +
            "%s\n\n" +
            "Hãy trả lời câu hỏi của học viên: \"%s\"\n\n" +
            "Hãy trả lời bằng TIẾNG VIỆT một cách rõ ràng, chi tiết, khoa học, định dạng bằng markdown. " +
            "Nếu thông tin không có trong phần trích xuất trên, hãy cố gắng trả lời dựa trên kiến thức của bạn một cách tốt nhất, nhưng ghi rõ là thông tin này bổ sung ngoài tài liệu.",
            context.toString(), query
        );

        String answer = "Không thể kết nối với AI vào lúc này.";
        try {
            answer = generateGeminiResponse(prompt);
        } catch (Exception e) {
            System.err.println("Error generating RAG chat response: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("answer", answer);
        result.put("citations", citations);
        return result;
    }

    public String generateGeminiResponse(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contentNode = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> body = Map.of(
            "contents", List.of(contentNode)
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String finalUrl = aiApiUrl + "?key=" + aiApiKey;
        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } else {
            throw new RuntimeException("Gemini request failed: " + response.getStatusCode());
        }
    }


    // ==========================================
    // CURRICULUM TOPIC BREAKDOWN
    // ==========================================

    public List<Topic> generateTopics(Long documentId, String content) throws Exception {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        String truncatedContent = content.length() > MAX_CONTENT_LENGTH 
                ? content.substring(0, MAX_CONTENT_LENGTH) 
                : content;

        String prompt = String.format(
            "Bạn là một chuyên gia thiết kế giáo trình học tập. Dựa trên nội dung học tập sau đây: \n\n%s\n\n" +
            "Hãy chia nhỏ nội dung thành các chương lớn và các chủ đề con tương ứng. " +
            "Chỉ trả về duy nhất một đối tượng JSON khớp chính xác với định dạng sau (không giải thích thêm):\n" +
            "{\"topics\": [{\"title\": \"Chương 1: ...\", \"description\": \"...\", \"subtopics\": [{\"title\": \"Chủ đề 1.1: ...\", \"description\": \"...\"}]}]}",
            truncatedContent
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contentNode = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> body = Map.of(
            "contents", List.of(contentNode)
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String finalUrl = aiApiUrl + "?key=" + aiApiKey;
        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);

        List<Topic> savedTopics = new ArrayList<>();
        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String jsonContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            if (jsonContent.contains("```json")) {
                jsonContent = jsonContent.substring(jsonContent.indexOf("```json") + 7, jsonContent.lastIndexOf("```"));
            } else if (jsonContent.contains("```")) {
                jsonContent = jsonContent.substring(jsonContent.indexOf("```") + 3, jsonContent.lastIndexOf("```"));
            }

            JsonNode topicsNode = objectMapper.readTree(jsonContent).path("topics");
            for (JsonNode tNode : topicsNode) {
                Topic parentTopic = new Topic(document, null, tNode.path("title").asText(), tNode.path("description").asText());
                parentTopic = topicRepository.save(parentTopic);
                savedTopics.add(parentTopic);

                JsonNode subtopicsNode = tNode.path("subtopics");
                if (subtopicsNode.isArray()) {
                    for (JsonNode subNode : subtopicsNode) {
                        Topic subTopic = new Topic(document, parentTopic, subNode.path("title").asText(), subNode.path("description").asText());
                        topicRepository.save(subTopic);
                    }
                }
            }
        }
        return savedTopics;
    }

    // ==========================================
    // QUESTIONS & ADAPTIVE QUIZ
    // ==========================================

    public List<Question> generateQuestions(Long documentId, String content) throws Exception {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Content cannot be empty");
        }

        // 1. Ensure topics exist
        List<Topic> docTopics = topicRepository.findByDocumentId(documentId);
        if (docTopics.isEmpty()) {
            docTopics = generateTopics(documentId, content);
        }

        List<String> topicTitles = new ArrayList<>();
        for (Topic t : docTopics) {
            topicTitles.add(t.getTitle());
        }
        String topicTitlesStr = String.join(", ", topicTitles);

        String truncatedContent = content.length() > MAX_CONTENT_LENGTH 
                ? content.substring(0, MAX_CONTENT_LENGTH) 
                : content;

        String prompt = String.format(
            "Bạn là một trợ lý học tập AI chuyên nghiệp. Dựa trên nội dung học tập sau đây: \n\n%s\n\n" +
            "Hãy tạo ra 5 câu hỏi trắc nghiệm bằng TIẾNG VIỆT. Mỗi câu hỏi phải bao gồm: \n" +
            "* question: nội dung câu hỏi\n" +
            "* options: 4 lựa chọn trả lời\n" +
            "* correct_answer: đáp án đúng (phải khớp chính xác với một trong các lựa chọn)\n" +
            "* explanation: giải thích chi tiết tại sao đáp án đó đúng\n" +
            "* topic: Tên chủ đề chính xác nhất mà câu hỏi này thuộc về, chọn từ danh sách sau: [%s]\n\n" +
            "Chỉ trả về duy nhất một đối tượng JSON theo định dạng sau:\n" +
            "{\"questions\": [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct_answer\": \"A\", \"explanation\": \"...\", \"topic\": \"...\"}]}",
            truncatedContent, topicTitlesStr
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contentNode = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> body = Map.of(
            "contents", List.of(contentNode)
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String finalUrl = aiApiUrl + "?key=" + aiApiKey;
        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return parseAndSaveQuestionsWithMetadata(documentId, response.getBody());
        } else {
            throw new RuntimeException("Gemini API failed: " + response.getStatusCode() + " - " + response.getBody());
        }
    }

    public List<Question> generateAdaptiveQuiz(Long documentId, List<String> weakTopics, String difficulty, List<String> pastMistakes) throws Exception {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        String content = document.getContent();

        // 1. Ensure topics exist
        List<Topic> docTopics = topicRepository.findByDocumentId(documentId);
        if (docTopics.isEmpty()) {
            docTopics = generateTopics(documentId, content);
        }

        List<String> topicTitles = new ArrayList<>();
        for (Topic t : docTopics) {
            topicTitles.add(t.getTitle());
        }
        String topicTitlesStr = String.join(", ", topicTitles);

        String truncatedContent = content.length() > MAX_CONTENT_LENGTH 
                ? content.substring(0, MAX_CONTENT_LENGTH) 
                : content;

        String prompt = String.format(
            "Bạn là một hệ thống thiết kế đề thi thích ứng (Adaptive Test). Dựa trên nội dung sau: \n\n%s\n\n" +
            "Hãy thiết kế bộ 5 câu hỏi học tập cá nhân hóa phù hợp với học viên:\n" +
            "- Mức độ khó mục tiêu: %s (EASY, MEDIUM, hoặc HARD)\n" +
            "- Tập trung cải thiện các chủ đề yếu sau: %s\n" +
            "- Tránh lặp lại các lỗi sai trước đây: %s\n\n" +
            "Bạn phải tạo ra 4 định dạng câu hỏi:\n" +
            "* MULTIPLE_CHOICE (Trắc nghiệm ABCD)\n" +
            "* TRUE_FALSE (Đúng / Sai)\n" +
            "* FILL_IN_BLANK (Điền vào chỗ trống)\n" +
            "* SHORT_ANSWER (Trả lời ngắn gọn)\n\n" +
            "Mỗi câu hỏi phải đi kèm một thuộc tính \"topic\" tương ứng với tên chủ đề mà câu hỏi đó đề cập đến, chọn từ danh sách sau: [%s]\n\n" +
            "Chỉ trả về duy nhất một đối tượng JSON theo định dạng sau (không giải thích thêm):\n" +
            "{\"questions\": [{\"question\": \"...\", \"options\": [\"...\", \"...\"], \"correct_answer\": \"...\", \"type\": \"MULTIPLE_CHOICE\", \"difficulty\": \"...\", \"explanation\": \"...\", \"topic\": \"...\"}]}",
            truncatedContent, difficulty, String.join(", ", weakTopics), String.join(", ", pastMistakes), topicTitlesStr
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contentNode = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> body = Map.of(
            "contents", List.of(contentNode)
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String finalUrl = aiApiUrl + "?key=" + aiApiKey;
        ResponseEntity<String> response = restTemplate.postForEntity(finalUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return parseAndSaveQuestionsWithMetadata(documentId, response.getBody());
        } else {
            throw new RuntimeException("Gemini API failed: " + response.getStatusCode());
        }
    }

    private List<Question> parseAndSaveQuestionsWithMetadata(Long documentId, String aiResponseBody) throws Exception {
        JsonNode root = objectMapper.readTree(aiResponseBody);
        String jsonContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        
        if (jsonContent.contains("```json")) {
            jsonContent = jsonContent.substring(jsonContent.indexOf("```json") + 7, jsonContent.lastIndexOf("```"));
        } else if (jsonContent.contains("```")) {
            jsonContent = jsonContent.substring(jsonContent.indexOf("```") + 3, jsonContent.lastIndexOf("```"));
        }

        JsonNode questionsNode = objectMapper.readTree(jsonContent).path("questions");
        List<Question> savedQuestions = new ArrayList<>();
        List<Topic> docTopics = topicRepository.findByDocumentId(documentId);

        for (JsonNode qNode : questionsNode) {
            Question question = new Question();
            question.setDocumentId(documentId);
            question.setQuestionText(qNode.path("question").asText());
            question.setExplanation(qNode.path("explanation").asText());
            question.setType(qNode.path("type").asText("MULTIPLE_CHOICE"));
            question.setDifficulty(qNode.path("difficulty").asText("MEDIUM"));
            
            // Resolve correct topic matching the AI response
            String targetTopicTitle = qNode.path("topic").asText();
            Topic matchedTopic = null;
            for (Topic t : docTopics) {
                if (t.getTitle().equalsIgnoreCase(targetTopicTitle) || 
                    t.getTitle().toLowerCase().contains(targetTopicTitle.toLowerCase()) ||
                    targetTopicTitle.toLowerCase().contains(t.getTitle().toLowerCase())) {
                    matchedTopic = t;
                    break;
                }
            }
            // Fallback to first topic if no match
            if (matchedTopic == null && !docTopics.isEmpty()) {
                matchedTopic = docTopics.get(0);
            }
            question.setTopic(matchedTopic);
            
            question = questionRepository.save(question);

            List<Answer> answers = new ArrayList<>();
            JsonNode options = qNode.path("options");
            String correctAnswer = qNode.path("correct_answer").asText();

            if (options.isArray() && options.size() > 0) {
                for (JsonNode option : options) {
                    String optionText = option.asText();
                    boolean isCorrect = optionText.equalsIgnoreCase(correctAnswer);
                    Answer answer = new Answer(question, optionText, isCorrect);
                    answers.add(answerRepository.save(answer));
                }
            } else {
                Answer answer = new Answer(question, correctAnswer, true);
                answers.add(answerRepository.save(answer));
            }
            
            question.setAnswers(answers);
            savedQuestions.add(question);
        }

        return savedQuestions;
    }


    // ==========================================
    // FLASHCARDS
    // ==========================================

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
            "* front: Câu hỏi, thuật ngữ, hoặc câu có chỗ trống dạng cloze [blank]\n" +
            "* back: Câu trả lời hoặc định nghĩa đầy đủ\n" +
            "* card_type: Loại thẻ (QA, TERM_DEFINITION, hoặc CLOZE)\n\n" +
            "Chỉ trả về duy nhất một đối tượng JSON theo định dạng:\n" +
            "{\"flashcards\": [{\"front\": \"...\", \"back\": \"...\", \"card_type\": \"QA\"}]}",
            truncatedContent
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contentNode = Map.of("parts", List.of(Map.of("text", prompt)));
        Map<String, Object> body = Map.of(
            "contents", List.of(contentNode)
        );

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

            List<Topic> topics = topicRepository.findByDocumentId(documentId);
            Topic defaultTopic = topics.isEmpty() ? null : topics.get(0);

            for (JsonNode fNode : flashcardsNode) {
                Flashcard flashcard = new Flashcard(
                    documentId, 
                    defaultTopic, 
                    fNode.path("card_type").asText("QA"),
                    fNode.path("front").asText(), 
                    fNode.path("back").asText()
                );
                savedFlashcards.add(flashcardRepository.save(flashcard));
            }
            return savedFlashcards;
        } else {
            throw new RuntimeException("Gemini API failed: " + response.getStatusCode());
        }
    }
}
