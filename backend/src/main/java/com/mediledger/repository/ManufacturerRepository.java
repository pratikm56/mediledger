package com.mediledger.repository;

import com.mediledger.entity.Manufacturer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManufacturerRepository extends JpaRepository<Manufacturer, Long> {
    Optional<Manufacturer> findByName(String name);
    boolean existsByName(String name);
    List<Manufacturer> findByActiveTrueOrderByNameAsc();
    List<Manufacturer> findAllByOrderByNameAsc();

    @Query("SELECT m FROM Manufacturer m WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.contact) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:activeOnly IS NULL OR m.active = :activeOnly)")
    Page<Manufacturer> searchManufacturers(@Param("query") String query,
                                          @Param("activeOnly") Boolean activeOnly,
                                          Pageable pageable);
}
