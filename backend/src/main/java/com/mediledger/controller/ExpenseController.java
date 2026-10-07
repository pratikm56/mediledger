package com.mediledger.controller;

import com.mediledger.dto.*;
import com.mediledger.service.ExpenseService;
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
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@Tag(name = "Expense Management", description = "Endpoints for pharmacy operational expenditures, categories, vouchers, and cash flow")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get active expense categories", description = "List all active expense categories for voucher assignment")
    public ResponseEntity<ApiResponse<List<ExpenseCategoryDto>>> getActiveCategories() {
        List<ExpenseCategoryDto> list = expenseService.getActiveCategories();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create expense category", description = "Create custom pharmacy expenditure category (OWNER or ADMIN only)")
    public ResponseEntity<ApiResponse<ExpenseCategoryDto>> createCategory(
            @Valid @RequestBody CreateExpenseCategoryRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        ExpenseCategoryDto created = expenseService.createCategory(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Expense category created", created));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search and list expenses", description = "Filter vouchers by category, recipient, or date range")
    public ResponseEntity<ApiResponse<Page<ExpenseDto>>> searchExpenses(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(sort = "expenseDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ExpenseDto> page = expenseService.searchExpenses(query, categoryId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/cash-flow")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Get financial cash flow summary", description = "Summary of receipts, expenses, supplier payments, and net liquidity")
    public ResponseEntity<ApiResponse<FinancialCashFlowSummaryDto>> getCashFlowSummary() {
        FinancialCashFlowSummaryDto summary = expenseService.getCashFlowSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get expense by ID", description = "Retrieve specific operational expense voucher")
    public ResponseEntity<ApiResponse<ExpenseDto>> getExpenseById(@PathVariable Long id) {
        ExpenseDto expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(ApiResponse.ok(expense));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Record expense voucher", description = "Book pharmacy expense voucher")
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(
            @Valid @RequestBody CreateExpenseRequestDto request,
            @AuthenticationPrincipal UserDetails currentUser) {
        ExpenseDto created = expenseService.createExpense(request, currentUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Expense voucher created successfully", created));
    }
}
