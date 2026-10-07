package com.mediledger.repository;

import com.mediledger.entity.MedicineBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    List<MedicineBatch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    // FEFO (First Expired First Out) batches available for sale (stock > 0 and not expired)
    @Query("SELECT b FROM MedicineBatch b WHERE b.medicine.id = :medicineId AND b.quantity > 0 AND b.expiryDate >= :currentDate ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findAvailableBatchesForSale(@Param("medicineId") Long medicineId, @Param("currentDate") LocalDate currentDate);

    // Expired batches with remaining stock
    @Query("SELECT b FROM MedicineBatch b WHERE b.expiryDate < :currentDate AND b.quantity > 0 ORDER BY b.expiryDate ASC")
    Page<MedicineBatch> findExpiredBatches(@Param("currentDate") LocalDate currentDate, Pageable pageable);

    // Batches expiring within a specific date window
    @Query("SELECT b FROM MedicineBatch b WHERE b.expiryDate BETWEEN :startDate AND :endDate AND b.quantity > 0 ORDER BY b.expiryDate ASC")
    Page<MedicineBatch> findExpiringBatches(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM MedicineBatch b WHERE b.medicine.id = :medicineId")
    Integer findTotalQuantityByMedicineId(@Param("medicineId") Long medicineId);

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM MedicineBatch b")
    Long sumTotalInventoryUnits();

    @Query("SELECT COALESCE(SUM(b.purchasePrice * b.quantity), 0) FROM MedicineBatch b")
    BigDecimal sumTotalPurchaseValuation();

    @Query("SELECT COALESCE(SUM(b.sellingPrice * b.quantity), 0) FROM MedicineBatch b")
    BigDecimal sumTotalSellingValuation();

    @Query("SELECT COALESCE(SUM(b.mrp * b.quantity), 0) FROM MedicineBatch b")
    BigDecimal sumTotalMrpValuation();

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.quantity > 0")
    Long countActiveBatches();

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.expiryDate < :currentDate AND b.quantity > 0")
    Long countExpiredBatches(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.expiryDate BETWEEN :startDate AND :endDate AND b.quantity > 0")
    Long countExpiringBatches(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    Optional<MedicineBatch> findByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);

    boolean existsByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);
}
