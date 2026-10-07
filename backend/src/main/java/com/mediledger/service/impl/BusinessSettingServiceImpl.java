package com.mediledger.service.impl;

import com.mediledger.dto.BusinessSettingDto;
import com.mediledger.dto.UpdateBusinessSettingsRequestDto;
import com.mediledger.entity.BusinessSetting;
import com.mediledger.repository.BusinessSettingRepository;
import com.mediledger.service.AuditService;
import com.mediledger.service.BusinessSettingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class BusinessSettingServiceImpl implements BusinessSettingService {

    private final BusinessSettingRepository repository;
    private final AuditService auditService;

    public BusinessSettingServiceImpl(BusinessSettingRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getAllSettingsAsMap() {
        return repository.findAll().stream()
                .collect(Collectors.toMap(
                        BusinessSetting::getKey,
                        s -> s.getValue() != null ? s.getValue() : "",
                        (v1, v2) -> v1,
                        LinkedHashMap::new
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusinessSettingDto> getAllSettings() {
        return repository.findAll().stream()
                .map(s -> new BusinessSettingDto(s.getKey(), s.getValue(), s.getDescription(), s.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return repository.findByKey(key)
                .map(BusinessSetting::getValue)
                .orElse(defaultValue);
    }

    @Override
    public Map<String, String> updateSettings(UpdateBusinessSettingsRequestDto request, String currentUsername) {
        updateSingleSetting("shop_name", request.getShopName(), "Medical Shop Name");
        updateSingleSetting("owner_name", request.getOwnerName(), "Pharmacy Owner / License Holder Name");
        updateSingleSetting("shop_address", request.getShopAddress(), "Shop Physical Address");
        updateSingleSetting("shop_phone", request.getShopPhone(), "Primary Contact Phone");
        updateSingleSetting("shop_email", request.getShopEmail(), "Primary Contact Email");
        updateSingleSetting("gstin", request.getGstin(), "Goods and Services Tax Identification Number");
        updateSingleSetting("invoice_prefix", request.getInvoicePrefix(), "Prefix for generated sales invoices");
        updateSingleSetting("invoice_counter", request.getInvoiceCounter(), "Sequential invoice number tracker");
        updateSingleSetting("currency", request.getCurrency(), "Default transaction currency");
        updateSingleSetting("currency_symbol", request.getCurrencySymbol(), "Currency Symbol");
        updateSingleSetting("default_gst_rate", request.getDefaultGstRate(), "Default GST percentage for medicines");
        updateSingleSetting("invoice_footer", request.getInvoiceFooter(), "Printed footer message on bills");

        auditService.logAction(currentUsername, "SETTINGS_UPDATED", "BUSINESS_SETTINGS", "GLOBAL",
                "Updated pharmacy business profile: " + request.getShopName() + " (GSTIN: " + request.getGstin() + ")", "127.0.0.1");

        return getAllSettingsAsMap();
    }

    private void updateSingleSetting(String key, String value, String defaultDescription) {
        if (value == null) {
            return;
        }
        BusinessSetting setting = repository.findByKey(key).orElse(null);
        if (setting == null) {
            setting = new BusinessSetting();
            setting.setKey(key);
            setting.setDescription(defaultDescription);
        }
        setting.setValue(value.trim());
        repository.save(setting);
    }
}
