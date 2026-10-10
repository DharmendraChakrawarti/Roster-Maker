package com.smartroster.service;

import com.smartroster.dto.BulkEmployeeRequest;
import com.smartroster.dto.EmployeeDTO;
import com.smartroster.entity.Employee;
import com.smartroster.exception.BusinessException;
import com.smartroster.exception.ResourceNotFoundException;
import com.smartroster.repository.EmployeeRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public List<EmployeeDTO> getAllActiveEmployees() {
        return getAllActiveEmployees(null);
    }

    public List<EmployeeDTO> getAllActiveEmployees(Long managerId) {
        if (managerId != null) {
            List<Employee> list = employeeRepository.findByManagerIdAndActiveTrueOrderByNameAsc(managerId);
            if (list.isEmpty()) {
                // If this manager has no private employees yet, check unassigned legacy employees
                List<Employee> unassigned = employeeRepository.findByManagerIdIsNullAndActiveTrueOrderByNameAsc();
                if (!unassigned.isEmpty()) {
                    return unassigned.stream().map(this::toDTO).collect(Collectors.toList());
                }
            }
            return list.stream().map(this::toDTO).collect(Collectors.toList());
        }
        return employeeRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EmployeeDTO> getAllEmployees() {
        return getAllEmployees(null);
    }

    public List<EmployeeDTO> getAllEmployees(Long managerId) {
        if (managerId != null) {
            List<Employee> list = employeeRepository.findByManagerIdOrderByNameAsc(managerId);
            if (list.isEmpty()) {
                List<Employee> unassigned = employeeRepository.findByManagerIdIsNullAndActiveTrueOrderByNameAsc();
                if (!unassigned.isEmpty()) {
                    return unassigned.stream().map(this::toDTO).collect(Collectors.toList());
                }
            }
            return list.stream().map(this::toDTO).collect(Collectors.toList());
        }
        return employeeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO getEmployee(Long id) {
        return toDTO(findById(id));
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO dto) {
        return createEmployee(dto, null, null);
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO dto, Long managerId, String managerName) {
        String trimmed = dto.getName().trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException("Employee name cannot be empty");
        }
        Employee employee = new Employee(trimmed);
        employee.setManagerId(managerId != null ? managerId : dto.getManagerId());
        employee.setManagerName(managerName != null ? managerName : dto.getManagerName());
        return toDTO(employeeRepository.save(employee));
    }

    @Transactional
    public List<EmployeeDTO> bulkCreateEmployees(BulkEmployeeRequest request) {
        return bulkCreateEmployees(request, null, null);
    }

    @Transactional
    public List<EmployeeDTO> bulkCreateEmployees(BulkEmployeeRequest request, Long managerId, String managerName) {
        if (request.getNames() == null || request.getNames().isEmpty()) {
            throw new BusinessException("No employee names provided");
        }

        List<EmployeeDTO> created = new ArrayList<>();
        for (String name : request.getNames()) {
            String trimmed = name.trim();
            if (!trimmed.isEmpty()) {
                Employee employee = new Employee(trimmed, managerId, managerName);
                created.add(toDTO(employeeRepository.save(employee)));
            }
        }

        if (created.isEmpty()) {
            throw new BusinessException("No valid employee names found");
        }

        return created;
    }

    @Transactional
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO dto) {
        Employee employee = findById(id);
        String trimmed = dto.getName().trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException("Employee name cannot be empty");
        }
        employee.setName(trimmed);
        if (dto.getActive() != null) {
            employee.setActive(dto.getActive());
        }
        if (dto.getManagerId() != null) {
            employee.setManagerId(dto.getManagerId());
            employee.setManagerName(dto.getManagerName());
        }
        return toDTO(employeeRepository.save(employee));
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = findById(id);
        employee.setActive(false);
        employeeRepository.save(employee);
    }

    @Transactional
    public List<EmployeeDTO> importFromFile(MultipartFile file) {
        return importFromFile(file, null, null);
    }

    @Transactional
    public List<EmployeeDTO> importFromFile(MultipartFile file, Long managerId, String managerName) {
        if (file.isEmpty()) {
            throw new BusinessException("Uploaded file is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BusinessException("Invalid file name");
        }

        List<String> names;
        try {
            if (filename.endsWith(".csv")) {
                names = parseCSV(file);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                names = parseExcel(file);
            } else {
                throw new BusinessException("Unsupported file format. Please upload CSV or Excel (.xlsx/.xls)");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Failed to parse file: " + e.getMessage());
        }

        if (names.isEmpty()) {
            throw new BusinessException("No employee names found in the uploaded file");
        }

        BulkEmployeeRequest bulkRequest = new BulkEmployeeRequest();
        bulkRequest.setNames(names);
        return bulkCreateEmployees(bulkRequest, managerId, managerName);
    }

    @Transactional
    public List<EmployeeDTO> seedStarterTeam(Long managerId, String managerName) {
        String[] starterNames = {
                "Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta",
                "Vikram Singh", "Neha Joshi", "Arjun Reddy", "Kavita Nair",
                "Rajesh Verma", "Meera Iyer", "Suresh Menon", "Deepa Krishnan"
        };
        List<EmployeeDTO> result = new ArrayList<>();
        for (String name : starterNames) {
            Employee emp = new Employee(name, managerId, managerName);
            result.add(toDTO(employeeRepository.save(emp)));
        }
        return result;
    }

    private List<String> parseCSV(MultipartFile file) throws Exception {
        List<String> names = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder().setIgnoreEmptyLines(true).build().parse(reader)) {
            for (CSVRecord record : parser) {
                if (record.size() > 0) {
                    String name = record.get(0).trim();
                    if (!name.isEmpty() && !name.equalsIgnoreCase("name") && !name.equalsIgnoreCase("employee name")) {
                        names.add(name);
                    }
                }
            }
        }
        return names;
    }

    private List<String> parseExcel(MultipartFile file) throws Exception {
        List<String> names = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                Cell cell = row.getCell(0);
                if (cell != null) {
                    String name = "";
                    if (cell.getCellType() == CellType.STRING) {
                        name = cell.getStringCellValue().trim();
                    } else if (cell.getCellType() == CellType.NUMERIC) {
                        name = String.valueOf((int) cell.getNumericCellValue());
                    }
                    if (!name.isEmpty() && !name.equalsIgnoreCase("name") && !name.equalsIgnoreCase("employee name")) {
                        names.add(name);
                    }
                }
            }
        }
        return names;
    }

    private Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    private EmployeeDTO toDTO(Employee e) {
        return new EmployeeDTO(e.getId(), e.getName(), e.getActive(), e.getManagerId(), e.getManagerName());
    }
}
