package com.smartroster.repository;

import com.smartroster.entity.ShiftConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShiftConfigRepository extends JpaRepository<ShiftConfig, Long> {
    List<ShiftConfig> findByActiveTrueOrderByDisplayOrderAsc();
    boolean existsByShiftNameIgnoreCase(String shiftName);
}
