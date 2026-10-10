package com.smartroster.service;

import com.smartroster.dto.*;
import com.smartroster.entity.Employee;
import com.smartroster.entity.Roster;
import com.smartroster.entity.User;
import com.smartroster.exception.BusinessException;
import com.smartroster.exception.ResourceNotFoundException;
import com.smartroster.repository.EmployeeRepository;
import com.smartroster.repository.RosterRepository;
import com.smartroster.repository.UserRepository;
import com.smartroster.security.SecurityUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RosterRepository rosterRepository;

    public UserService(UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       RosterRepository rosterRepository) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.rosterRepository = rosterRepository;
    }

    @PostConstruct
    @Transactional
    public void initDefaultUsers() {
        User manager;
        if (userRepository.count() == 0) {
            // Seed Admin DC
            User dc = new User(
                    "dc",
                    "dc@smartroster.io",
                    SecurityUtils.hashPassword("dc123"),
                    "ADMIN",
                    "Dharmendra Chakrawarti",
                    "Engineering & Management"
            );
            userRepository.save(dc);

            // Seed System Admin
            User admin = new User(
                    "admin",
                    "admin@smartroster.io",
                    SecurityUtils.hashPassword("admin123"),
                    "ADMIN",
                    "System Administrator",
                    "IT & Security"
            );
            userRepository.save(admin);

            // Seed Shift Manager
            manager = new User(
                    "manager",
                    "manager@smartroster.io",
                    SecurityUtils.hashPassword("manager123"),
                    "MANAGER",
                    "Shift Operations Manager",
                    "Operations"
            );
            manager = userRepository.save(manager);

            // Seed Staff Users reporting directly to Shift Manager
            User rahul = new User(
                    "rahul",
                    "rahul@smartroster.io",
                    SecurityUtils.hashPassword("user123"),
                    "USER",
                    "Rahul Sharma",
                    "Support & Operations",
                    manager.getId(),
                    manager.getFullName()
            );
            userRepository.save(rahul);

            User priya = new User(
                    "priya",
                    "priya@smartroster.io",
                    SecurityUtils.hashPassword("user123"),
                    "USER",
                    "Priya Patel",
                    "Logistics",
                    manager.getId(),
                    manager.getFullName()
            );
            userRepository.save(priya);
        } else {
            // Link existing manager if available
            Optional<User> mgrOpt = userRepository.findByUsernameIgnoreCase("manager");
            manager = mgrOpt.orElse(null);
        }

        // Ensure existing unassigned employees & rosters belong to the default manager
        if (manager != null) {
            List<Employee> unassignedEmps = employeeRepository.findByManagerIdIsNullAndActiveTrueOrderByNameAsc();
            for (Employee emp : unassignedEmps) {
                emp.setManagerId(manager.getId());
                emp.setManagerName(manager.getFullName());
                employeeRepository.save(emp);
            }

            List<Roster> rosters = rosterRepository.findAll();
            for (Roster r : rosters) {
                if (r.getManagerId() == null) {
                    r.setManagerId(manager.getId());
                    r.setManagerName(manager.getFullName());
                    rosterRepository.save(r);
                }
            }
        }
    }

    public List<ManagerSummaryDTO> getActiveManagers() {
        List<User> managers = userRepository.findByRoleAndActiveTrueOrderByFullNameAsc("MANAGER");
        return managers.stream()
                .map(ManagerSummaryDTO::fromUser)
                .collect(Collectors.toList());
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String identifier = request.getUsername().trim();
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmailIgnoreCase(identifier);
        }

        if (userOpt.isEmpty()) {
            throw new BusinessException("Invalid username/email or password.");
        }

        User user = userOpt.get();
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException("Your account is disabled. Please contact the administrator.");
        }

        if (!SecurityUtils.verifyPassword(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Invalid username/email or password.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = SecurityUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
        return new AuthResponse(token, UserDTO.fromEntity(user), "Authentication successful.");
    }

    @Transactional
    public AuthResponse register(CreateUserRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new BusinessException("Username '" + username + "' is already taken.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Email '" + email + "' is already registered.");
        }

        String role = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().toUpperCase() : "USER";

        Long managerId = null;
        String managerName = null;

        if ("USER".equalsIgnoreCase(role)) {
            // Staff user must report to a manager
            if (request.getManagerId() != null) {
                Optional<User> mgrOpt = userRepository.findById(request.getManagerId());
                if (mgrOpt.isPresent()) {
                    managerId = mgrOpt.get().getId();
                    managerName = mgrOpt.get().getFullName();
                }
            }
            if (managerId == null) {
                // Fallback to default manager
                Optional<User> defaultMgr = userRepository.findByUsernameIgnoreCase("manager");
                if (defaultMgr.isPresent()) {
                    managerId = defaultMgr.get().getId();
                    managerName = defaultMgr.get().getFullName();
                }
            }
        }

        User user = new User(
                username,
                email,
                SecurityUtils.hashPassword(request.getPassword()),
                role,
                request.getFullName(),
                request.getDepartment() != null ? request.getDepartment() : "Operations",
                managerId,
                managerName
        );
        user.setLastLoginAt(LocalDateTime.now());
        user = userRepository.save(user);

        // If newly registered user is a MANAGER, seed starter team so they can instantly generate rosters
        if ("MANAGER".equalsIgnoreCase(role)) {
            seedStarterEmployees(user.getId(), user.getFullName());
        }

        String token = SecurityUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
        return new AuthResponse(token, UserDTO.fromEntity(user), "Account created successfully.");
    }

    public UserDTO getCurrentUser(String token) {
        SecurityUtils.TokenPayload payload = SecurityUtils.verifyToken(token);
        if (payload == null) {
            throw new BusinessException("Invalid or expired session token.");
        }

        User user = userRepository.findById(payload.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException("Account is disabled.");
        }

        return UserDTO.fromEntity(user);
    }

    // -------------------------------------------------------------
    // Admin User Management Operations
    // -------------------------------------------------------------

    public List<UserDTO> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new BusinessException("Username '" + username + "' already exists.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Email '" + email + "' already registered.");
        }

        String role = request.getRole() != null ? request.getRole().toUpperCase() : "USER";

        Long managerId = null;
        String managerName = null;
        if ("USER".equalsIgnoreCase(role)) {
            if (request.getManagerId() != null) {
                Optional<User> mgr = userRepository.findById(request.getManagerId());
                if (mgr.isPresent()) {
                    managerId = mgr.get().getId();
                    managerName = mgr.get().getFullName();
                }
            }
        }

        User user = new User(
                username,
                email,
                SecurityUtils.hashPassword(request.getPassword()),
                role,
                request.getFullName(),
                request.getDepartment() != null ? request.getDepartment() : "Operations",
                managerId,
                managerName
        );

        user = userRepository.save(user);

        if ("MANAGER".equalsIgnoreCase(role)) {
            seedStarterEmployees(user.getId(), user.getFullName());
        }

        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmailIgnoreCase(newEmail)) {
                throw new BusinessException("Email '" + newEmail + "' is already used by another account.");
            }
            user.setEmail(newEmail);
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            String newRole = request.getRole().toUpperCase();
            if ("ADMIN".equals(user.getRole()) && !"ADMIN".equals(newRole)) {
                // Ensure at least one admin remains active
                long adminCount = userRepository.countByRole("ADMIN");
                if (adminCount <= 1) {
                    throw new BusinessException("Cannot revoke ADMIN role from the only remaining system administrator.");
                }
            }
            user.setRole(newRole);
            if (!"USER".equals(newRole)) {
                user.setManagerId(null);
                user.setManagerName(null);
            }
        }

        if (request.getManagerId() != null && "USER".equals(user.getRole())) {
            Optional<User> mgrOpt = userRepository.findById(request.getManagerId());
            if (mgrOpt.isPresent()) {
                user.setManagerId(mgrOpt.get().getId());
                user.setManagerName(mgrOpt.get().getFullName());
            }
        }

        if (request.getActive() != null) {
            if (!request.getActive() && "ADMIN".equals(user.getRole())) {
                long activeAdmins = userRepository.findAll().stream()
                        .filter(u -> "ADMIN".equals(u.getRole()) && Boolean.TRUE.equals(u.getActive()) && !u.getId().equals(id))
                        .count();
                if (activeAdmins == 0) {
                    throw new BusinessException("Cannot deactivate the only active system administrator.");
                }
            }
            user.setActive(request.getActive());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getNewPassword().length() < 6) {
                throw new BusinessException("Password must be at least 6 characters.");
            }
            user.setPasswordHash(SecurityUtils.hashPassword(request.getNewPassword()));
        }

        user = userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if ("ADMIN".equals(user.getRole())) {
            long adminCount = userRepository.countByRole("ADMIN");
            if (adminCount <= 1) {
                throw new BusinessException("Cannot delete the only system administrator.");
            }
        }

        userRepository.delete(user);
    }

    @Transactional
    public UserDTO toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if ("ADMIN".equals(user.getRole()) && Boolean.TRUE.equals(user.getActive())) {
            long activeAdmins = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equals(u.getRole()) && Boolean.TRUE.equals(u.getActive()) && !u.getId().equals(id))
                    .count();
            if (activeAdmins == 0) {
                throw new BusinessException("Cannot deactivate the only active system administrator.");
            }
        }

        user.setActive(!Boolean.TRUE.equals(user.getActive()));
        user = userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException("New password must be at least 6 characters.");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setPasswordHash(SecurityUtils.hashPassword(newPassword));
        userRepository.save(user);
    }

    public AdminStatsDTO getAdminStats() {
        AdminStatsDTO stats = new AdminStatsDTO();
        stats.setTotalUsers(userRepository.count());
        stats.setActiveUsers(userRepository.countByActiveTrue());
        stats.setAdminCount(userRepository.countByRole("ADMIN"));
        stats.setManagerCount(userRepository.countByRole("MANAGER"));
        stats.setUserCount(userRepository.countByRole("USER"));
        stats.setActiveEmployeesCount(employeeRepository.countByActiveTrue());
        return stats;
    }

    private void seedStarterEmployees(Long managerId, String managerName) {
        if (employeeRepository.countByManagerId(managerId) == 0) {
            String[] starterNames = {
                    "Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta",
                    "Vikram Singh", "Neha Joshi", "Arjun Reddy", "Kavita Nair",
                    "Rajesh Verma", "Meera Iyer", "Suresh Menon", "Deepa Krishnan"
            };
            for (String name : starterNames) {
                Employee emp = new Employee(name, managerId, managerName);
                employeeRepository.save(emp);
            }
        }
    }
}
