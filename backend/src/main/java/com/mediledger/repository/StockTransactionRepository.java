package com.mediledger.repository;

import com.mediledger.entity.StockTransaction;
import com.mediledger.entity.StockTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    Page<StockTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<StockTransaction> findByMedicineIdOrderByCreatedAtDesc(Long medicineId, Pageable pageable);

    Page<StockTransaction> findByBatchIdOrderByCreatedAtDesc(Long batchId, Pageable pageable);

    Page<StockTransaction> findByTransactionTypeOrderByCreatedAtDesc(StockTransactionType transactionType, Pageable pageable);
}
