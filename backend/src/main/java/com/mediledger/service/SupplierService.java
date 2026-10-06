package com.mediledger.service;

import com.mediledger.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SupplierService {

    Page<SupplierDto> searchSuppliers(String query, Boolean activeOnly, Pageable pageable);

    SupplierDto getSupplierById(Long id);

    List<SupplierDto> getActiveSuppliers();

    SupplierDto createSupplier(CreateSupplierRequestDto request, String currentUsername);

    SupplierDto updateSupplier(Long id, UpdateSupplierRequestDto request, String currentUsername);

    SupplierDto toggleSupplierStatus(Long id, String currentUsername);

    Page<SupplierDto> getSuppliersWithOutstanding(Pageable pageable);

    SupplierOutstandingSummaryDto getOutstandingSummary();
}
