package com.smartroster.repository;

import com.smartroster.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByActiveTrueOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    long countByActiveTrue();
}
