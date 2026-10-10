package com.smartroster.service;

import com.smartroster.dto.CreateDepartmentRequest;
import com.smartroster.dto.DepartmentDTO;
import com.smartroster.entity.Department;
import com.smartroster.entity.User;
import com.smartroster.exception.BusinessException;
import com.smartroster.exception.ResourceNotFoundException;
import com.smartroster.repository.DepartmentRepository;
import com.smartroster.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public DepartmentService(DepartmentRepository departmentRepository, UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    public List<DepartmentDTO> getAllDepartments() {
        List<Department> departments = departmentRepository.findAllByOrderByNameAsc();
        List<User> users = userRepository.findAll();

        return departments.stream()
                .map(dept -> {
                    long count = users.stream()
                            .filter(u -> dept.getName().equalsIgnoreCase(u.getDepartment()))
                            .count();
                    return DepartmentDTO.fromEntity(dept, count);
                })
                .collect(Collectors.toList());
    }

    public DepartmentDTO getDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        long count = userRepository.findAll().stream()
                .filter(u -> dept.getName().equalsIgnoreCase(u.getDepartment()))
                .count();
        return DepartmentDTO.fromEntity(dept, count);
    }

    @Transactional
    public DepartmentDTO createDepartment(CreateDepartmentRequest request) {
        String name = request.getName().trim();
        if (departmentRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Department '" + name + "' already exists.");
        }

        Department dept = new Department(
                name,
                request.getDescription() != null ? request.getDescription().trim() : null
        );
        dept = departmentRepository.save(dept);
        return DepartmentDTO.fromEntity(dept, 0);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        // Check if users are currently in this department
        long usersInDept = userRepository.findAll().stream()
                .filter(u -> dept.getName().equalsIgnoreCase(u.getDepartment()))
                .count();

        if (usersInDept > 0) {
            throw new BusinessException("Cannot delete department '" + dept.getName() + "' because " +
                    usersInDept + " user(s) are currently assigned to it. Reassign users first.");
        }

        departmentRepository.delete(dept);
    }
}
