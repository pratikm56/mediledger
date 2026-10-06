package com.mediledger.repository;

import com.mediledger.entity.BusinessSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessSettingRepository extends JpaRepository<BusinessSetting, Long> {
    Optional<BusinessSetting> findByKey(String key);
    boolean existsByKey(String key);
}
