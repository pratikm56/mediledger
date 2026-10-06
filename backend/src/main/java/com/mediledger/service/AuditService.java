package com.mediledger.service;

import com.mediledger.entity.AuditLog;

public interface AuditService {
    AuditLog logAction(Long userId, String action, String entityType, String entityId, String details, String ipAddress);
}
