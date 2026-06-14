package com.studyplatform.backend.repository;

import com.studyplatform.backend.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    List<DocumentChunk> findByDocumentId(Long documentId);

    @Query(value = "SELECT * FROM document_chunks " +
                   "WHERE document_id = :documentId " +
                   "ORDER BY embedding <=> cast(:queryEmbedding as vector) LIMIT :limit", 
           nativeQuery = true)
    List<DocumentChunk> findSimilarChunks(@Param("documentId") Long documentId, 
                                          @Param("queryEmbedding") String queryEmbedding, 
                                          @Param("limit") int limit);
}
