package com.mediledger.service;

import com.mediledger.dto.CreatePurchaseRequestDto;
import com.mediledger.dto.PurchaseDto;
import com.mediledger.dto.PurchaseSummaryDto;
import com.mediledger.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface PurchaseService {

    Page<PurchaseDto> searchPurchases(String query, Long supplierId, PaymentStatus status, LocalDate startDate, LocalDate endDate, Pageable pageable);

    PurchaseDto getPurchaseById(Long id);

    PurchaseDto createPurchase(CreatePurchaseRequestDto request, String currentUsername);

    PurchaseSummaryDto getPurchaseSummary();
}
