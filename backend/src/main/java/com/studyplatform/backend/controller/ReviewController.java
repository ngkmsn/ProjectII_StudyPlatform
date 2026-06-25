package com.studyplatform.backend.controller;

import com.studyplatform.backend.entity.*;
import com.studyplatform.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewItemRepository reviewItemRepository;

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private TopicRepository topicRepository;

    @GetMapping("/today")
    public ResponseEntity<?> getDueReviews(@RequestParam(required = false) Long documentId) {
        try {
            User user = getCurrentUser();
            
            if (documentId != null) {
                // Initialize ReviewItems for flashcards of this specific document
                List<Flashcard> flashcards = flashcardRepository.findByDocumentId(documentId);
                for (Flashcard card : flashcards) {
                    if (reviewItemRepository.findByUserIdAndFlashcardId(user.getId(), card.getId()).isEmpty()) {
                        ReviewItem item = new ReviewItem(user, card, null);
                        item.setDueDate(LocalDateTime.now());
                        reviewItemRepository.save(item);
                    }
                }
                
                // Return all review items for this specific document that are due, limited to 20
                List<ReviewItem> result = reviewItemRepository.findByUserIdAndFlashcardDocumentIdAndDueDateBeforeOrderByDueDateAsc(
                        user.getId(), documentId, LocalDateTime.now(), org.springframework.data.domain.Limit.of(20)
                );
                return ResponseEntity.ok(result);
            } else {
                // Fallback for all due reviews if no documentId is specified, limited to 20
                List<ReviewItem> allDue = reviewItemRepository.findByUserIdAndDueDateBeforeOrderByDueDateAsc(
                        user.getId(), LocalDateTime.now(), org.springframework.data.domain.Limit.of(20)
                );
                return ResponseEntity.ok(allDue);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching reviews: " + e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> payload) {
        try {
            User user = getCurrentUser();
            Long reviewItemId = Long.valueOf(payload.get("reviewItemId").toString());
            int quality = Integer.parseInt(payload.get("qualityScore").toString());

            if (quality < 0 || quality > 5) {
                return ResponseEntity.badRequest().body("Quality score must be between 0 and 5");
            }

            ReviewItem item = reviewItemRepository.findById(reviewItemId)
                    .orElseThrow(() -> new IllegalArgumentException("Review item not found"));

            if (!item.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Access denied");
            }

            int prevInterval = item.getIntervalDays();
            double ef = item.getEaseFactor();
            int reps = item.getRepetitions();

            // Calculate new Ease Factor using SM-2 formula
            ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (ef < 1.3) ef = 1.3;

            int newInterval;
            if (quality >= 3) {
                if (reps == 0) {
                    newInterval = 1;
                } else if (reps == 1) {
                    newInterval = 6;
                } else {
                    newInterval = (int) Math.round(prevInterval * ef);
                }
                reps = reps + 1;
            } else {
                reps = 0;
                newInterval = 1;
            }

            // Save review history
            ReviewHistory history = new ReviewHistory(item, quality, prevInterval, newInterval);
            reviewHistoryRepository.save(history);

            // Update item details
            item.setEaseFactor(ef);
            item.setRepetitions(reps);
            item.setIntervalDays(newInterval);
            item.setDueDate(LocalDateTime.now().plusDays(newInterval));
            item.setBoxLevel(quality >= 3 ? Math.min(5, item.getBoxLevel() + 1) : 1);
            
            reviewItemRepository.save(item);

            // Update topic progress (masteryLevel) if applicable
            Topic topic = null;
            if (item.getFlashcard() != null) {
                topic = item.getFlashcard().getTopic();
            }
            if (topic != null) {
                double increment = (quality >= 3) ? 0.05 : -0.1;
                double newMastery = Math.min(1.0, Math.max(0.0, topic.getMasteryLevel() + increment));
                topic.setMasteryLevel(newMastery);
                topicRepository.save(topic);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("newInterval", newInterval);
            response.put("dueDate", item.getDueDate());
            response.put("boxLevel", item.getBoxLevel());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error submitting review: " + e.getMessage());
        }
    }

    @GetMapping("/history/stats")
    public ResponseEntity<?> getReviewHistoryStats() {
        try {
            User user = getCurrentUser();
            List<Object[]> stats = reviewHistoryRepository.getReviewCountGroupByDay(user.getId());
            List<java.util.Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : stats) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("date", row[0].toString());
                map.put("count", row[1]);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error fetching review statistics: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
