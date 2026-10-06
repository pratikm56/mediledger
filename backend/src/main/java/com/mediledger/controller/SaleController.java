package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.entity.PaymentStatus;
import com.mediledger.service.SaleService;
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
@RequestMapping("/api/sales")
@Tag(name = "Sales & Billing", description = "Endpoints for retail pharmacy counter sales, POS dispensing, invoice lookup, and sales KPIs")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search and list sales", description = "Filter retail sales by customer, invoice number, payment status, or date range")
    public ResponseEntity<ApiResponse<Page<SaleDto>>> searchSales(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(sort = "saleDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SaleDto> page = saleService.searchSales(query, customerId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get sales metrics summary", description = "KPI summary of total sales, today's sales, and pending credit balances")
    public ResponseEntity<ApiResponse<SaleSummaryDto>> getSaleSummary() {
        SaleSummaryDto summary = saleService.getSaleSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get sale by ID", description = "Retrieve full invoice bill with dispensed batches and tax breakdown")
    public ResponseEntity<ApiResponse<SaleDto>> getSaleById(@PathVariable Long id) {
        SaleDto sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.ok(sale));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get sale by invoice number", description = "Lookup invoice by bill code for receipt reprint")
    public ResponseEntity<ApiResponse<SaleDto>> getSaleByInvoiceNumber(@PathVariable String invoiceNumber) {
        SaleDto sale = saleService.getSaleByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(ApiResponse.ok(sale));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Create retail sale invoice", description = "Process checkout, atomically deduct batch inventory, generate ledger audit, and update customer ledger")
    public ResponseEntity<ApiResponse<SaleDto>> createSale(
            @Valid @RequestBody CreateSaleRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        SaleDto created = saleService.createSale(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Sale invoice generated successfully", created));
    }
}
