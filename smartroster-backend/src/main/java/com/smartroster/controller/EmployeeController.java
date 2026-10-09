package com.smartroster.controller;

import com.smartroster.dto.BulkEmployeeRequest;
import com.smartroster.dto.EmployeeDTO;
import com.smartroster.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees(
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        List<EmployeeDTO> employees = activeOnly ?
                employeeService.getAllActiveEmployees() : employeeService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(dto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<EmployeeDTO>> bulkCreateEmployees(@RequestBody BulkEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.bulkCreateEmployees(request));
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importEmployees(@RequestParam("file") MultipartFile file) {
        List<EmployeeDTO> imported = employeeService.importFromFile(file);
        return ResponseEntity.ok(Map.of(
                "message", imported.size() + " employees imported successfully",
                "employees", imported
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
