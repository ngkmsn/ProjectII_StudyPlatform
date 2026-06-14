package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByDocumentId(Long documentId);
    List<Topic> findByDocumentIdAndParentIsNull(Long documentId);
}
