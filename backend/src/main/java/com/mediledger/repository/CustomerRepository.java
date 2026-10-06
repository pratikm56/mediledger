package com.mediledger.repository;

import com.mediledger.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " c.phone LIKE CONCAT('%', :query, '%') OR " +
           " LOWER(c.doctorName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:activeOnly IS NULL OR c.active = :activeOnly)")
    Page<Customer> searchCustomers(@Param("query") String query,
                                   @Param("activeOnly") Boolean activeOnly,
                                   Pageable pageable);

    Optional<Customer> findByPhone(String phone);

    @Query("SELECT c FROM Customer c WHERE c.currentBalance > 0 ORDER BY c.currentBalance DESC")
    Page<Customer> findCustomersWithOutstanding(Pageable pageable);

    @Query("SELECT COALESCE(SUM(c.currentBalance), 0) FROM Customer c WHERE c.currentBalance > 0")
    BigDecimal sumTotalReceivables();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.currentBalance > 0")
    Long countCustomersWithOutstanding();

    List<Customer> findByActiveTrueOrderByNameAsc();
}
