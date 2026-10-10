package com.smartroster.repository;

import com.smartroster.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByActiveTrueOrderByNameAsc();
    List<Employee> findByManagerIdAndActiveTrueOrderByNameAsc(Long managerId);
    List<Employee> findByManagerIdOrderByNameAsc(Long managerId);
    List<Employee> findByManagerIdIsNullAndActiveTrueOrderByNameAsc();
    List<Employee> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndManagerId(String name, Long managerId);
    long countByActiveTrue();
    long countByManagerIdAndActiveTrue(Long managerId);
    long countByManagerId(Long managerId);
}
