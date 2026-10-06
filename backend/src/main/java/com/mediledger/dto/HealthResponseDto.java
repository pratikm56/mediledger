package com.mediledger.dto;

import java.time.OffsetDateTime;

public class HealthResponseDto {

    private String status;
    private String database;
    private String version;
    private String environment;
    private long uptimeSeconds;
    private OffsetDateTime timestamp;

    public HealthResponseDto() {
        this.timestamp = OffsetDateTime.now();
    }

    public HealthResponseDto(String status, String database, String version, String environment, long uptimeSeconds) {
        this.status = status;
        this.database = database;
        this.version = version;
        this.environment = environment;
        this.uptimeSeconds = uptimeSeconds;
        this.timestamp = OffsetDateTime.now();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public long getUptimeSeconds() {
        return uptimeSeconds;
    }

    public void setUptimeSeconds(long uptimeSeconds) {
        this.uptimeSeconds = uptimeSeconds;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
