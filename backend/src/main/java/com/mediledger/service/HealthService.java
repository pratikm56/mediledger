package com.mediledger.service;

import com.mediledger.dto.HealthResponseDto;

public interface HealthService {
    HealthResponseDto getSystemHealth();
}
