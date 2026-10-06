package com.mediledger;

import com.mediledger.entity.AuditLog;
import com.mediledger.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
class AuditLogVerificationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void testAuditLogsExist() {
        List<AuditLog> logs = auditLogRepository.findAll();
        assertFalse(logs.isEmpty(), "Audit logs must not be empty after system initialization and tests");
        for (AuditLog log : logs) {
            System.out.println("LOG: action=" + log.getAction() + " entity=" + log.getEntityType() + " details=" + log.getDetails());
        }
    }
}
