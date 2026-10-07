package com.mediledger.service;

import com.mediledger.dto.AuditLogDto;
import com.mediledger.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AuditService {

    AuditLog logAction(Long userId, String action, String entityType, String entityId, String details, String ipAddress);

    AuditLog logAction(String username, String action, String entityType, String entityId, String details, String ipAddress);

    Page<AuditLogDto> getAuditLogs(String query, String action, String entityType, Long userId,
                                   LocalDate startDate, LocalDate endDate, Pageable pageable);

    byte[] exportAuditLogsToCsv(String query, String action, String entityType, Long userId,
                                LocalDate startDate, LocalDate endDate);
}
