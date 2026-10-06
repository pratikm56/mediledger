package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.entity.PaymentStatus;
import com.mediledger.service.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/purchases")
@Tag(name = "Purchase Management", description = "Endpoints for inward medicine purchases, stock intake, and supplier invoice ledger")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Search and list purchases", description = "Filter inward purchases by invoice number, supplier, status, or date range")
    public ResponseEntity<ApiResponse<Page<PurchaseDto>>> searchPurchases(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(sort = "purchaseDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PurchaseDto> page = purchaseService.searchPurchases(query, supplierId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get purchase KPI summary", description = "Summary of total purchases, paid amounts, and outstanding payable bills")
    public ResponseEntity<ApiResponse<PurchaseSummaryDto>> getPurchaseSummary() {
        PurchaseSummaryDto summary = purchaseService.getPurchaseSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get purchase by ID", description = "Retrieve full invoice details with line items and batch information")
    public ResponseEntity<ApiResponse<PurchaseDto>> getPurchaseById(@PathVariable Long id) {
        PurchaseDto purchase = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(ApiResponse.ok(purchase));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Record inward purchase", description = "Record new purchase invoice, automatically update batch stock, ledger transactions, and supplier payables")
    public ResponseEntity<ApiResponse<PurchaseDto>> createPurchase(
            @Valid @RequestBody CreatePurchaseRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        PurchaseDto created = purchaseService.createPurchase(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Purchase recorded successfully", created));
    }
}
