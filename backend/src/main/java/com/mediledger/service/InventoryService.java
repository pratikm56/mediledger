package com.mediledger.service;

import com.mediledger.dto.InventorySummaryDto;
import com.mediledger.dto.MedicineBatchDto;
import com.mediledger.dto.MedicineStockDto;
import com.mediledger.dto.StockAdjustmentRequestDto;
import com.mediledger.dto.StockTransactionDto;
import com.mediledger.entity.StockTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryService {

    StockTransactionDto adjustStock(StockAdjustmentRequestDto request, String currentUsername);

    InventorySummaryDto getInventorySummary();

    Page<MedicineStockDto> getMedicineStockOverview(String query, Long categoryId, Boolean lowStockOnly, Pageable pageable);

    Page<MedicineBatchDto> getExpiringBatches(int days, Pageable pageable);

    Page<MedicineBatchDto> getExpiredBatches(Pageable pageable);

    Page<StockTransactionDto> getStockTransactions(Long medicineId, Long batchId, StockTransactionType type, Pageable pageable);
}
