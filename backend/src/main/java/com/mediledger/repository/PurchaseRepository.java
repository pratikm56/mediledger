package com.mediledger.repository;

import com.mediledger.entity.PaymentStatus;
import com.mediledger.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Optional<Purchase> findByPurchaseNumber(String purchaseNumber);

    @Query("SELECT p FROM Purchase p WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(p.purchaseNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.supplierInvoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:supplierId IS NULL OR p.supplier.id = :supplierId) AND " +
           "(:status IS NULL OR p.paymentStatus = :status) AND " +
           "(:startDate IS NULL OR p.purchaseDate >= :startDate) AND " +
           "(:endDate IS NULL OR p.purchaseDate <= :endDate)")
    Page<Purchase> searchPurchases(@Param("query") String query,
                                  @Param("supplierId") Long supplierId,
                                  @Param("status") PaymentStatus status,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate,
                                  Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p")
    BigDecimal sumTotalPurchasesAmount();

    @Query("SELECT COALESCE(SUM(p.paidAmount), 0) FROM Purchase p")
    BigDecimal sumTotalPurchasesPaid();

    @Query("SELECT COUNT(p) FROM Purchase p WHERE p.paymentStatus = 'UNPAID' OR p.paymentStatus = 'PARTIAL'")
    Long countUnpaidPurchases();

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p WHERE p.purchaseDate = :today")
    BigDecimal sumPurchasesToday(@Param("today") LocalDate today);

    @Query("SELECT COUNT(p) FROM Purchase p WHERE p.purchaseDate = :today")
    Long countPurchasesToday(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Purchase p WHERE p.purchaseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumPurchasesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT p.purchaseDate, COALESCE(SUM(p.totalAmount), 0), COUNT(p) FROM Purchase p WHERE p.purchaseDate BETWEEN :startDate AND :endDate GROUP BY p.purchaseDate ORDER BY p.purchaseDate ASC")
    java.util.List<Object[]> getDailyPurchasesSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
