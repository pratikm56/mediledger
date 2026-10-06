package com.mediledger.repository;

import com.mediledger.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    @Query("SELECT m FROM Medicine m WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(m.genericName) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:categoryId IS NULL OR m.category.id = :categoryId) AND " +
           "(:manufacturerId IS NULL OR m.manufacturer.id = :manufacturerId) AND " +
           "(:activeOnly IS NULL OR m.active = :activeOnly)")
    Page<Medicine> searchMedicines(@Param("query") String query,
                                  @Param("categoryId") Long categoryId,
                                  @Param("manufacturerId") Long manufacturerId,
                                  @Param("activeOnly") Boolean activeOnly,
                                  Pageable pageable);

    @Query("SELECT m FROM Medicine m WHERE m.active = TRUE ORDER BY m.name ASC")
    List<Medicine> findAllActive();

    long countByCategoryId(Long categoryId);

    long countByManufacturerId(Long manufacturerId);

    boolean existsByNameIgnoreCase(String name);
}
