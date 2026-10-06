package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.CreateMedicineBatchRequestDto;
import com.mediledger.dto.MedicineBatchDto;
import com.mediledger.dto.UpdateMedicineBatchRequestDto;
import com.mediledger.service.BatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
@Tag(name = "Medicine Batch Management", description = "Endpoints for managing batches, expiries, purchase/selling rates and FEFO allocation")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create medicine batch", description = "Register a new batch with expiry date, prices, and initial stock")
    public ResponseEntity<ApiResponse<MedicineBatchDto>> createBatch(
            @Valid @RequestBody CreateMedicineBatchRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        MedicineBatchDto created = batchService.createBatch(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Batch created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Update batch details", description = "Update prices and expiry date for a batch (Stock changes must use /api/inventory/adjust)")
    public ResponseEntity<ApiResponse<MedicineBatchDto>> updateBatch(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicineBatchRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        MedicineBatchDto updated = batchService.updateBatch(id, request, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Batch updated successfully", updated));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get batch by ID", description = "Retrieve single batch details")
    public ResponseEntity<ApiResponse<MedicineBatchDto>> getBatchById(@PathVariable Long id) {
        MedicineBatchDto batch = batchService.getBatchById(id);
        return ResponseEntity.ok(ApiResponse.ok(batch));
    }

    @GetMapping("/medicine/{medicineId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get all batches for medicine", description = "List all batches (including depleted/expired) for a medicine")
    public ResponseEntity<ApiResponse<List<MedicineBatchDto>>> getBatchesByMedicine(@PathVariable Long medicineId) {
        List<MedicineBatchDto> batches = batchService.getBatchesByMedicine(medicineId);
        return ResponseEntity.ok(ApiResponse.ok(batches));
    }

    @GetMapping("/medicine/{medicineId}/available-for-sale")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get available batches for sale", description = "Returns active, non-expired batches with stock > 0 in FEFO order (expiry ASC)")
    public ResponseEntity<ApiResponse<List<MedicineBatchDto>>> getAvailableBatchesForSale(@PathVariable Long medicineId) {
        List<MedicineBatchDto> batches = batchService.getAvailableBatchesForSale(medicineId);
        return ResponseEntity.ok(ApiResponse.ok(batches));
    }
}
