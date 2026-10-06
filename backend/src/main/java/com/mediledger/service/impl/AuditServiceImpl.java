package com.mediledger.service.impl;

import com.mediledger.entity.AuditLog;
import com.mediledger.entity.User;
import com.mediledger.repository.AuditLogRepository;
import com.mediledger.repository.UserRepository;
import com.mediledger.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
}
