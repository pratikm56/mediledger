package com.mediledger.service;

import com.mediledger.dto.CreateMedicineRequestDto;
import com.mediledger.dto.MedicineDto;
import com.mediledger.dto.UpdateMedicineRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MedicineService {
    Page<MedicineDto> searchMedicines(String query, Long categoryId, Long manufacturerId, Boolean activeOnly, Pageable pageable);
    List<MedicineDto> getAllActiveMedicines();
    MedicineDto getMedicineById(Long id);
    MedicineDto createMedicine(CreateMedicineRequestDto request, String currentUsername);
    MedicineDto updateMedicine(Long id, UpdateMedicineRequestDto request, String currentUsername);
    MedicineDto toggleMedicineStatus(Long id, String currentUsername);
}
