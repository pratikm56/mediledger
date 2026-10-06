package com.mediledger.controller;

import com.mediledger.dto.HealthResponseDto;
import com.mediledger.service.HealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health & System Diagnostics", description = "Endpoints for verifying system and database connectivity")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    @Operation(summary = "Get system health status", description = "Checks Spring Boot runtime and PostgreSQL connectivity")
    public ResponseEntity<HealthResponseDto> checkHealth() {
        return ResponseEntity.ok(healthService.getSystemHealth());
    }
}
