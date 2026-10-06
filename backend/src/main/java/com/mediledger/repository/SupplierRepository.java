package com.mediledger.repository;

import com.mediledger.entity.Supplier;
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
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query("SELECT s FROM Supplier s WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " s.phone LIKE CONCAT('%', :query, '%') OR " +
           " LOWER(s.contactPerson) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.gstNumber) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:activeOnly IS NULL OR s.active = :activeOnly)")
    Page<Supplier> searchSuppliers(@Param("query") String query,
                                   @Param("activeOnly") Boolean activeOnly,
                                   Pageable pageable);

    Optional<Supplier> findByPhone(String phone);

    @Query("SELECT s FROM Supplier s WHERE s.currentBalance > 0 ORDER BY s.currentBalance DESC")
    Page<Supplier> findSuppliersWithOutstanding(Pageable pageable);

    @Query("SELECT COALESCE(SUM(s.currentBalance), 0) FROM Supplier s WHERE s.currentBalance > 0")
    BigDecimal sumTotalPayables();

    @Query("SELECT COUNT(s) FROM Supplier s WHERE s.currentBalance > 0")
    Long countSuppliersWithOutstanding();

    List<Supplier> findByActiveTrueOrderByNameAsc();
}
