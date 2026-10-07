package com.mediledger.service;

import com.mediledger.dto.BusinessSettingDto;
import com.mediledger.dto.UpdateBusinessSettingsRequestDto;

import java.util.List;
import java.util.Map;

public interface BusinessSettingService {

    Map<String, String> getAllSettingsAsMap();

    List<BusinessSettingDto> getAllSettings();

    String getSettingValue(String key, String defaultValue);

    Map<String, String> updateSettings(UpdateBusinessSettingsRequestDto request, String currentUsername);
}
