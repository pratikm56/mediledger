package com.mediledger.service;

import com.mediledger.dto.CreateSaleRequestDto;
import com.mediledger.dto.SaleDto;
import com.mediledger.dto.SaleSummaryDto;
import com.mediledger.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface SaleService {

    Page<SaleDto> searchSales(String query, Long customerId, PaymentStatus status, LocalDate startDate, LocalDate endDate, Pageable pageable);

    SaleDto getSaleById(Long id);

    SaleDto getSaleByInvoiceNumber(String invoiceNumber);

    SaleDto createSale(CreateSaleRequestDto request, String currentUsername);

    SaleSummaryDto getSaleSummary();
}
