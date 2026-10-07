package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.UpdateBusinessSettingsRequestDto;
import com.mediledger.service.BusinessSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@Tag(name = "Business Settings", description = "Endpoints for pharmacy trade configuration, store address, GSTIN, and POS invoice formatting")
public class BusinessSettingController {

    private final BusinessSettingService settingService;

    public BusinessSettingController(BusinessSettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get all business settings", description = "Retrieve pharmacy store profile, GSTIN, and POS billing configurations")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllSettings() {
        Map<String, String> settings = settingService.getAllSettingsAsMap();
        return ResponseEntity.ok(ApiResponse.ok(settings));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update business settings", description = "Modify shop name, proprietor name, address, GSTIN, invoice prefix, and bill footer (OWNER/ADMIN only)")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateSettings(
            @Valid @RequestBody UpdateBusinessSettingsRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "SYSTEM";
        Map<String, String> updated = settingService.updateSettings(request, username);
        return ResponseEntity.ok(ApiResponse.ok("Business settings updated successfully", updated));
    }
}
