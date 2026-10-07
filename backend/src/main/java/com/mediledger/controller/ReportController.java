package com.mediledger.controller;

import com.mediledger.dto.ApiResponse;
import com.mediledger.dto.report.*;
import com.mediledger.entity.PaymentMode;
import com.mediledger.entity.PaymentStatus;
import com.mediledger.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports & Analytics", description = "Endpoints for pharmacy sales, purchases, expenses, profit, stock, and ledger outstandings")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Sales Report", description = "Detailed retail sales report with revenue, tax, discount, and balance totals")
    public ResponseEntity<ApiResponse<SalesReportDto>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) PaymentMode paymentMode,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        SalesReportDto report = reportService.getSalesReport(startDate, endDate, customerId, paymentStatus, paymentMode, query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/purchases")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Purchase Report", description = "Inward purchase report with supplier invoices, total paid, and balances")
    public ResponseEntity<ApiResponse<PurchaseReportDto>> getPurchaseReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        PurchaseReportDto report = reportService.getPurchaseReport(startDate, endDate, supplierId, paymentStatus, query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Expense Report", description = "Store operating expenditures categorized by category with voucher breakdowns")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> getExpenseReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        ExpenseReportDto report = reportService.getExpenseReport(startDate, endDate, categoryId, query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/profit")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Basic Profit Report", description = "Gross and Net Profit calculated from Sales, Batch COGS, and Operating Expenses")
    public ResponseEntity<ApiResponse<BasicProfitReportDto>> getBasicProfitReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        BasicProfitReportDto report = reportService.getBasicProfitReport(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/stock-summary")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Stock Summary Report", description = "High-level inventory summary, valuations, potential margins, and category breakdown")
    public ResponseEntity<ApiResponse<StockSummaryReportDto>> getStockSummaryReport() {
        StockSummaryReportDto report = reportService.getStockSummaryReport();
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/stock-detailed")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Detailed Stock Report", description = "Batch-level inventory table with purchase/mrp valuations and stock/expiry statuses")
    public ResponseEntity<ApiResponse<Page<DetailedStockItemDto>>> getDetailedStockReport(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long manufacturerId,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false) String expiryStatus,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<DetailedStockItemDto> page = reportService.getDetailedStockReport(query, categoryId, manufacturerId, stockStatus, expiryStatus, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Low Stock Report", description = "Medicines at or below minimum threshold with deficit and suggested reorder quantities")
    public ResponseEntity<ApiResponse<Page<LowStockReportItemDto>>> getLowStockReport(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LowStockReportItemDto> page = reportService.getLowStockReport(query, categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/expiry")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Expiry Report", description = "Batches at risk or expired with days remaining and purchase capital at risk")
    public ResponseEntity<ApiResponse<Page<ExpiryReportItemDto>>> getExpiryReport(
            @RequestParam(required = false) String window,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ExpiryReportItemDto> page = reportService.getExpiryReport(window, query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/customer-outstanding")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Customer Outstanding Report", description = "Customer credit ledger balances, total invoiced, and total paid")
    public ResponseEntity<ApiResponse<Page<CustomerOutstandingReportItemDto>>> getCustomerOutstandingReport(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CustomerOutstandingReportItemDto> page = reportService.getCustomerOutstandingReport(query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/supplier-outstanding")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Supplier Outstanding Report", description = "Supplier pending bills, total purchases, and total cleared payments")
    public ResponseEntity<ApiResponse<Page<SupplierOutstandingReportItemDto>>> getSupplierOutstandingReport(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<SupplierOutstandingReportItemDto> page = reportService.getSupplierOutstandingReport(query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/export/csv/{reportType}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Export Report to CSV", description = "Downloads filtered report data in standard RFC 4180 CSV format")
    public ResponseEntity<byte[]> exportReportToCsv(
            @PathVariable String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String query) {
        byte[] csvData = reportService.exportReportToCsv(reportType, startDate, endDate, query);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + reportType + "_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
