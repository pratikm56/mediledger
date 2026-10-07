package com.mediledger.repository;

import com.mediledger.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySaleId(Long saleId);

    List<SaleItem> findByMedicineId(Long medicineId);

    List<SaleItem> findByBatchId(Long batchId);

    @Query("SELECT COALESCE(SUM(si.purchasePrice * si.quantity), 0) FROM SaleItem si WHERE si.sale.saleDate = :date")
    BigDecimal sumCostOfGoodsSoldByDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(si.purchasePrice * si.quantity), 0) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal sumCostOfGoodsSoldBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(si.purchasePrice * si.quantity), 0) FROM SaleItem si")
    BigDecimal sumTotalCostOfGoodsSold();

    @Query("SELECT si.sale.saleDate, COALESCE(SUM(si.purchasePrice * si.quantity), 0) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate GROUP BY si.sale.saleDate ORDER BY si.sale.saleDate ASC")
    List<Object[]> getDailyCogsSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
