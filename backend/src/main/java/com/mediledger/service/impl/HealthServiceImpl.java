package com.mediledger.service.impl;

import com.mediledger.dto.HealthResponseDto;
import com.mediledger.service.HealthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.Statement;

@Service
public class HealthServiceImpl implements HealthService {

    private static final Logger log = LoggerFactory.getLogger(HealthServiceImpl.class);
    private final DataSource dataSource;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    public HealthServiceImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public HealthResponseDto getSystemHealth() {
        String dbStatus = "DOWN";
        try (Connection connection = dataSource.getConnection();
             Statement stmt = connection.createStatement()) {
            stmt.execute("SELECT 1");
            dbStatus = "UP";
        } catch (Exception ex) {
            log.error("Database health check failed: {}", ex.getMessage());
            dbStatus = "DOWN (" + ex.getMessage() + ")";
        }

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        String systemStatus = "UP".equals(dbStatus) ? "UP" : "DEGRADED";

        return new HealthResponseDto(
                systemStatus,
                dbStatus,
                "1.0.0-SNAPSHOT",
                activeProfile,
                uptimeSeconds
        );
    }
}
