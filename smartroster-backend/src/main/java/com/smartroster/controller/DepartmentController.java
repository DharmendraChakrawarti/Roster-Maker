package com.smartroster.controller;

import com.smartroster.dto.CreateDepartmentRequest;
import com.smartroster.dto.DepartmentDTO;
import com.smartroster.entity.User;
import com.smartroster.exception.BusinessException;
import com.smartroster.security.AuthHelper;
import com.smartroster.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final AuthHelper authHelper;

    public DepartmentController(DepartmentService departmentService, AuthHelper authHelper) {
        this.departmentService = departmentService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO> getDepartment(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartment(id));
    }

    @PostMapping
    public ResponseEntity<DepartmentDTO> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        if (user == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException("Access Denied: Only System Administrators can add new departments.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentService.createDepartment(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        if (user == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException("Access Denied: Only System Administrators can delete departments.");
        }
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
