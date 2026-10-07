package com.mediledger.service.impl;

import com.mediledger.dto.AuditLogDto;
import com.mediledger.entity.AuditLog;
import com.mediledger.entity.User;
import com.mediledger.repository.AuditLogRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog logAction(Long userId, String action, String entityType, String entityId, String details, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog();
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                auditLog.setUser(user);
            }
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setDetails(details);
            auditLog.setIpAddress(ipAddress);

            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("AUDIT: UserID={} Action={} Entity={}:{}", userId, action, entityType, entityId);
            return saved;
        } catch (Exception ex) {
            log.error("Failed to record audit log: {}", ex.getMessage());
            return null;
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog logAction(String username, String action, String entityType, String entityId, String details, String ipAddress) {
        Long userId = null;
        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                userId = user.getId();
            }
        }
        return logAction(userId, action, entityType, entityId, details, ipAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(String query, String action, String entityType, Long userId,
                                         LocalDate startDate, LocalDate endDate, Pageable pageable) {
        OffsetDateTime start = (startDate != null)
                ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC)
                : OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime end = (endDate != null)
                ? endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC).minusNanos(1)
                : OffsetDateTime.of(2099, 12, 31, 23, 59, 59, 999999999, ZoneOffset.UTC);
        String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
        String cleanAction = (action != null && !action.isBlank()) ? action.trim() : null;
        String cleanEntity = (entityType != null && !entityType.isBlank()) ? entityType.trim() : null;

        return auditLogRepository.searchAuditLogs(cleanQuery, cleanAction, cleanEntity, userId, start, end, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAuditLogsToCsv(String query, String action, String entityType, Long userId,
                                       LocalDate startDate, LocalDate endDate) {
        Page<AuditLogDto> logs = getAuditLogs(query, action, entityType, userId, startDate, endDate, PageRequest.of(0, 5000));
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Timestamp,User,Full Name,Action,Entity Type,Entity ID,Details,IP Address\n");

        for (AuditLogDto dto : logs.getContent()) {
            csv.append(dto.getId()).append(",")
                    .append(dto.getCreatedAt()).append(",")
                    .append(escape(dto.getUsername())).append(",")
                    .append(escape(dto.getUserFullName())).append(",")
                    .append(escape(dto.getAction())).append(",")
                    .append(escape(dto.getEntityType())).append(",")
                    .append(escape(dto.getEntityId())).append(",")
                    .append(escape(dto.getDetails())).append(",")
                    .append(escape(dto.getIpAddress())).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private AuditLogDto toDto(AuditLog entity) {
        AuditLogDto dto = new AuditLogDto();
        dto.setId(entity.getId());
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
            dto.setUsername(entity.getUser().getUsername());
            dto.setUserFullName(entity.getUser().getFullName());
        } else {
            dto.setUsername("SYSTEM");
            dto.setUserFullName("System Automation");
        }
        dto.setAction(entity.getAction());
        dto.setEntityType(entity.getEntityType());
        dto.setEntityId(entity.getEntityId());
        dto.setDetails(entity.getDetails());
        dto.setIpAddress(entity.getIpAddress());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private String escape(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
