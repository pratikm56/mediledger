package com.mediledger.service;

import com.mediledger.dto.CreateMedicineBatchRequestDto;
import com.mediledger.dto.MedicineBatchDto;
import com.mediledger.dto.UpdateMedicineBatchRequestDto;

import java.util.List;

public interface BatchService {

    MedicineBatchDto createBatch(CreateMedicineBatchRequestDto request, String currentUsername);

    MedicineBatchDto updateBatch(Long id, UpdateMedicineBatchRequestDto request, String currentUsername);

    MedicineBatchDto getBatchById(Long id);

    List<MedicineBatchDto> getBatchesByMedicine(Long medicineId);

    List<MedicineBatchDto> getAvailableBatchesForSale(Long medicineId);
}
