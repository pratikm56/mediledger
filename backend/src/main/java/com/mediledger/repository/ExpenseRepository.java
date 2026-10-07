package com.mediledger.repository;

import com.mediledger.entity.Expense;
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
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Optional<Expense> findByVoucherNumber(String voucherNumber);

    @Query("SELECT e FROM Expense e WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(e.voucherNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(e.recipientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(e.notes) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(e.referenceNumber) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:categoryId IS NULL OR e.category.id = :categoryId) AND " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate)")
    Page<Expense> searchExpenses(@Param("query") String query,
                                 @Param("categoryId") Long categoryId,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate,
                                 Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e")
    BigDecimal sumTotalExpenses();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate = :today")
    BigDecimal sumExpensesToday(@Param("today") LocalDate today);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.expenseDate = :today")
    Long countExpensesToday(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumExpensesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e.expenseDate, COALESCE(SUM(e.amount), 0), COUNT(e) FROM Expense e WHERE e.expenseDate BETWEEN :startDate AND :endDate GROUP BY e.expenseDate ORDER BY e.expenseDate ASC")
    java.util.List<Object[]> getDailyExpensesSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
