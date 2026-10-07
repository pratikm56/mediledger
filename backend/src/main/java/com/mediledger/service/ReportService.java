package com.mediledger.service;

import com.mediledger.dto.report.*;
import com.mediledger.entity.PaymentMode;
import com.mediledger.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface ReportService {

    SalesReportDto getSalesReport(LocalDate startDate, LocalDate endDate, Long customerId,
                                  PaymentStatus paymentStatus, PaymentMode paymentMode,
                                  String query, Pageable pageable);

    PurchaseReportDto getPurchaseReport(LocalDate startDate, LocalDate endDate, Long supplierId,
                                        PaymentStatus paymentStatus, String query, Pageable pageable);

    ExpenseReportDto getExpenseReport(LocalDate startDate, LocalDate endDate, Long categoryId,
                                      String query, Pageable pageable);

    BasicProfitReportDto getBasicProfitReport(LocalDate startDate, LocalDate endDate);

    StockSummaryReportDto getStockSummaryReport();

    Page<DetailedStockItemDto> getDetailedStockReport(String query, Long categoryId, Long manufacturerId,
                                                      String stockStatus, String expiryStatus, Pageable pageable);

    Page<LowStockReportItemDto> getLowStockReport(String query, Long categoryId, Pageable pageable);

    Page<ExpiryReportItemDto> getExpiryReport(String window, String query, Pageable pageable);

    Page<CustomerOutstandingReportItemDto> getCustomerOutstandingReport(String query, Pageable pageable);

    Page<SupplierOutstandingReportItemDto> getSupplierOutstandingReport(String query, Pageable pageable);

    byte[] exportReportToCsv(String reportType, LocalDate startDate, LocalDate endDate, String query);
}
