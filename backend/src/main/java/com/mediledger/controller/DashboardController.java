package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard & Analytics", description = "Endpoints for executive pharmacy performance summary, revenue trends, and operational alerts")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get pharmacy executive dashboard summary", description = "Retrieves today's sales, purchases, expenses, basic profit, inventory valuations, stock alerts, and outstanding balances")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get daily financial & profit trend series", description = "Retrieves daily continuous sales, purchases, expenses, COGS, and profit figures over the past N days")
    public ResponseEntity<ApiResponse<List<DashboardTrendDto>>> getDashboardTrends(
            @RequestParam(defaultValue = "7") int days) {
        List<DashboardTrendDto> trends = dashboardService.getDashboardTrends(days);
        return ResponseEntity.ok(ApiResponse.ok(trends));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get operational alerts & recent activity", description = "Retrieves top low stock medicines, near-expiry batches, expired stock, and recent sales bills")
    public ResponseEntity<ApiResponse<DashboardAlertsDto>> getDashboardAlerts() {
        DashboardAlertsDto alerts = dashboardService.getDashboardAlerts();
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }
}
