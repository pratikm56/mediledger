package com.mediledger.service;

import com.mediledger.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {

    Page<CustomerDto> searchCustomers(String query, Boolean activeOnly, Pageable pageable);

    CustomerDto getCustomerById(Long id);

    CustomerDto getCustomerByPhone(String phone);

    List<CustomerDto> getActiveCustomers();

    CustomerDto createCustomer(CreateCustomerRequestDto request, String currentUsername);

    CustomerDto updateCustomer(Long id, UpdateCustomerRequestDto request, String currentUsername);

    CustomerDto toggleCustomerStatus(Long id, String currentUsername);

    Page<CustomerDto> getCustomersWithOutstanding(Pageable pageable);

    CustomerOutstandingSummaryDto getOutstandingSummary();
}
