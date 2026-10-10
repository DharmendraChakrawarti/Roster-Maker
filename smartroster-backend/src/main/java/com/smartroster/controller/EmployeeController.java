package com.smartroster.controller;

import com.smartroster.dto.BulkEmployeeRequest;
import com.smartroster.dto.EmployeeDTO;
import com.smartroster.entity.User;
import com.smartroster.security.AuthHelper;
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
    private final AuthHelper authHelper;

    public EmployeeController(EmployeeService employeeService, AuthHelper authHelper) {
        this.employeeService = employeeService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees(
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(required = false) Long managerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, managerId);
        List<EmployeeDTO> employees = activeOnly ?
                employeeService.getAllActiveEmployees(targetManagerId) :
                employeeService.getAllEmployees(targetManagerId);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(
            @Valid @RequestBody EmployeeDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, dto.getManagerId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createEmployee(dto, targetManagerId, user.getFullName()));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<EmployeeDTO>> bulkCreateEmployees(
            @RequestBody BulkEmployeeRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.bulkCreateEmployees(request, targetManagerId, user.getFullName()));
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importEmployees(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, null);
        List<EmployeeDTO> imported = employeeService.importFromFile(file, targetManagerId, user.getFullName());
        return ResponseEntity.ok(Map.of(
                "message", imported.size() + " employees imported successfully",
                "employees", imported
        ));
    }

    @PostMapping("/seed-starter-team")
    public ResponseEntity<List<EmployeeDTO>> seedStarterTeam(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, null);
        return ResponseEntity.ok(employeeService.seedStarterTeam(targetManagerId, user.getFullName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
