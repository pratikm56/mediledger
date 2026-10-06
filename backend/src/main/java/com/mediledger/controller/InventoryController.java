package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.entity.StockTransactionType;
import com.mediledger.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory Management", description = "Endpoints for stock tracking, valuations, adjustments, and expiry monitoring")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get inventory KPI summary", description = "Retrieve total units, valuations, low stock alert count, and expiry counts")
    public ResponseEntity<ApiResponse<InventorySummaryDto>> getInventorySummary() {
        InventorySummaryDto summary = inventoryService.getInventorySummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/stock-overview")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get stock overview", description = "List medicines with current stock, min stock threshold, and batch breakdown")
    public ResponseEntity<ApiResponse<Page<MedicineStockDto>>> getStockOverview(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean lowStockOnly,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MedicineStockDto> overview = inventoryService.getMedicineStockOverview(query, categoryId, lowStockOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get expiring batches", description = "List batches expiring within N days (default 30)")
    public ResponseEntity<ApiResponse<Page<MedicineBatchDto>>> getExpiringBatches(
            @RequestParam(defaultValue = "30") int days,
            @PageableDefault(sort = "expiryDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MedicineBatchDto> expiring = inventoryService.getExpiringBatches(days, pageable);
        return ResponseEntity.ok(ApiResponse.ok(expiring));
    }

    @GetMapping("/expired")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get expired batches", description = "List all batches that have passed their expiry date with remaining stock")
    public ResponseEntity<ApiResponse<Page<MedicineBatchDto>>> getExpiredBatches(
            @PageableDefault(sort = "expiryDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MedicineBatchDto> expired = inventoryService.getExpiredBatches(pageable);
        return ResponseEntity.ok(ApiResponse.ok(expired));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get stock transactions ledger", description = "Audit trail of every stock change with reason and actor")
    public ResponseEntity<ApiResponse<Page<StockTransactionDto>>> getStockTransactions(
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) StockTransactionType type,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<StockTransactionDto> transactions = inventoryService.getStockTransactions(medicineId, batchId, type, pageable);
        return ResponseEntity.ok(ApiResponse.ok(transactions));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Adjust stock quantity", description = "Adjust stock for a batch with mandatory reason (ADJUSTMENT, DAMAGED, EXPIRED)")
    public ResponseEntity<ApiResponse<StockTransactionDto>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        StockTransactionDto tx = inventoryService.adjustStock(request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Stock adjusted successfully", tx));
    }
}
