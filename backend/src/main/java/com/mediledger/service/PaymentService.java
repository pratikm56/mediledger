package com.mediledger.service;

import com.mediledger.dto.CreatePaymentRequestDto;
import com.mediledger.dto.PaymentDto;
import com.mediledger.entity.PaymentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface PaymentService {

    Page<PaymentDto> searchPayments(PaymentType type, Long customerId, Long supplierId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    PaymentDto getPaymentById(Long id);

    PaymentDto createPayment(CreatePaymentRequestDto request, String currentUsername);
}
