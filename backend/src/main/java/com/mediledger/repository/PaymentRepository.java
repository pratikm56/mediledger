package com.mediledger.repository;

import com.mediledger.entity.Payment;
import com.mediledger.entity.PaymentType;
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
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByReceiptNumber(String receiptNumber);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:type IS NULL OR p.paymentType = :type) AND " +
           "(:customerId IS NULL OR (p.customer IS NOT NULL AND p.customer.id = :customerId)) AND " +
           "(:supplierId IS NULL OR (p.supplier IS NOT NULL AND p.supplier.id = :supplierId)) AND " +
           "(:startDate IS NULL OR p.paymentDate >= :startDate) AND " +
           "(:endDate IS NULL OR p.paymentDate <= :endDate)")
    Page<Payment> searchPayments(@Param("type") PaymentType type,
                                 @Param("customerId") Long customerId,
                                 @Param("supplierId") Long supplierId,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate,
                                 Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentType = 'CUSTOMER_RECEIPT'")
    BigDecimal sumTotalCustomerReceipts();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentType = 'SUPPLIER_PAYMENT'")
    BigDecimal sumTotalSupplierPayments();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentType = 'CUSTOMER_RECEIPT' AND p.paymentDate = :today")
    BigDecimal sumTodayCustomerReceipts(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentType = 'SUPPLIER_PAYMENT' AND p.paymentDate = :today")
    BigDecimal sumTodaySupplierPayments(@Param("today") LocalDate today);
}
