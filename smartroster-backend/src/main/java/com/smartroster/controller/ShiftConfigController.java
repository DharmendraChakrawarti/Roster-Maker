package com.smartroster.controller;

import com.smartroster.dto.ShiftConfigDTO;
import com.smartroster.service.ShiftConfigService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shift-configs")
public class ShiftConfigController {

    private final ShiftConfigService shiftConfigService;

    public ShiftConfigController(ShiftConfigService shiftConfigService) {
        this.shiftConfigService = shiftConfigService;
    }

    @GetMapping
    public ResponseEntity<List<ShiftConfigDTO>> getShiftConfigs(
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        List<ShiftConfigDTO> configs = activeOnly ?
                shiftConfigService.getActiveShiftConfigs() : shiftConfigService.getAllShiftConfigs();
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftConfigDTO> getShiftConfig(@PathVariable Long id) {
        return ResponseEntity.ok(shiftConfigService.getShiftConfig(id));
    }

    @PostMapping
    public ResponseEntity<ShiftConfigDTO> createShiftConfig(@Valid @RequestBody ShiftConfigDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shiftConfigService.createShiftConfig(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftConfigDTO> updateShiftConfig(@PathVariable Long id,
                                                            @Valid @RequestBody ShiftConfigDTO dto) {
        return ResponseEntity.ok(shiftConfigService.updateShiftConfig(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShiftConfig(@PathVariable Long id) {
        shiftConfigService.deleteShiftConfig(id);
        return ResponseEntity.noContent().build();
    }
}
