package com.mediledger.repository;

import com.mediledger.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a LEFT JOIN a.user u WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(a.action) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.entityType) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.entityId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.details) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(a.ipAddress) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " (u IS NOT NULL AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))))) AND " +
           "(:action IS NULL OR :action = '' OR a.action = :action) AND " +
           "(:entityType IS NULL OR :entityType = '' OR a.entityType = :entityType) AND " +
           "(:userId IS NULL OR (u IS NOT NULL AND u.id = :userId)) AND " +
           "a.createdAt >= :startDate AND a.createdAt <= :endDate")
    Page<AuditLog> searchAuditLogs(@Param("query") String query,
                                  @Param("action") String action,
                                  @Param("entityType") String entityType,
                                  @Param("userId") Long userId,
                                  @Param("startDate") OffsetDateTime startDate,
                                  @Param("endDate") OffsetDateTime endDate,
                                  Pageable pageable);
}
