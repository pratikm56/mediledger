package com.mediledger.repository;

import com.mediledger.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySaleId(Long saleId);

    List<SaleItem> findByMedicineId(Long medicineId);

    List<SaleItem> findByBatchId(Long batchId);
}
