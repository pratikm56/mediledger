package com.mediledger.repository;

import com.mediledger.entity.PaymentStatus;
import com.mediledger.entity.Sale;
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
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT s FROM Sale s WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(s.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.customerName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.customerPhone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.doctorName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:customerId IS NULL OR (s.customer IS NOT NULL AND s.customer.id = :customerId)) AND " +
           "(:status IS NULL OR s.paymentStatus = :status) AND " +
           "(:startDate IS NULL OR s.saleDate >= :startDate) AND " +
           "(:endDate IS NULL OR s.saleDate <= :endDate)")
    Page<Sale> searchSales(@Param("query") String query,
                           @Param("customerId") Long customerId,
                           @Param("status") PaymentStatus status,
                           @Param("startDate") LocalDate startDate,
                           @Param("endDate") LocalDate endDate,
                           Pageable pageable);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s")
    BigDecimal sumTotalSalesAmount();

    @Query("SELECT COALESCE(SUM(s.paidAmount), 0) FROM Sale s")
    BigDecimal sumTotalSalesPaid();

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate = :today")
    Long countSalesToday(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.saleDate = :today")
    BigDecimal sumSalesTodayAmount(@Param("today") LocalDate today);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.paymentStatus = 'UNPAID' OR s.paymentStatus = 'PARTIAL'")
    Long countUnpaidSales();
}
