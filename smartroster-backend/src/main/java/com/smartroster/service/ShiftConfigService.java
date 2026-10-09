package com.smartroster.service;

import com.smartroster.dto.ShiftConfigDTO;
import com.smartroster.entity.ShiftConfig;
import com.smartroster.exception.BusinessException;
import com.smartroster.exception.ResourceNotFoundException;
import com.smartroster.repository.ShiftConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShiftConfigService {

    private final ShiftConfigRepository shiftConfigRepository;

    public ShiftConfigService(ShiftConfigRepository shiftConfigRepository) {
        this.shiftConfigRepository = shiftConfigRepository;
    }

    public List<ShiftConfigDTO> getActiveShiftConfigs() {
        return shiftConfigRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ShiftConfigDTO> getAllShiftConfigs() {
        return shiftConfigRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ShiftConfigDTO getShiftConfig(Long id) {
        return toDTO(findById(id));
    }

    @Transactional
    public ShiftConfigDTO createShiftConfig(ShiftConfigDTO dto) {
        ShiftConfig config = new ShiftConfig();
        config.setShiftName(dto.getShiftName().trim());
        config.setWeekdayCount(dto.getWeekdayCount());
        config.setWeekendCount(dto.getWeekendCount());
        config.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        config.setColorCode(dto.getColorCode() != null ? dto.getColorCode() : "#4CAF50");
        config.setActive(true);
        return toDTO(shiftConfigRepository.save(config));
    }

    @Transactional
    public ShiftConfigDTO updateShiftConfig(Long id, ShiftConfigDTO dto) {
        ShiftConfig config = findById(id);
        config.setShiftName(dto.getShiftName().trim());
        config.setWeekdayCount(dto.getWeekdayCount());
        config.setWeekendCount(dto.getWeekendCount());
        if (dto.getDisplayOrder() != null) config.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getColorCode() != null) config.setColorCode(dto.getColorCode());
        if (dto.getActive() != null) config.setActive(dto.getActive());
        return toDTO(shiftConfigRepository.save(config));
    }

    @Transactional
    public void deleteShiftConfig(Long id) {
        ShiftConfig config = findById(id);
        config.setActive(false);
        shiftConfigRepository.save(config);
    }

    private ShiftConfig findById(Long id) {
        return shiftConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift config not found with id: " + id));
    }

    private ShiftConfigDTO toDTO(ShiftConfig c) {
        return new ShiftConfigDTO(c.getId(), c.getShiftName(), c.getWeekdayCount(),
                c.getWeekendCount(), c.getDisplayOrder(), c.getColorCode(), c.getActive());
    }
}
