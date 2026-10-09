package com.smartroster.service;

import com.smartroster.dto.*;
import com.smartroster.entity.User;
import com.smartroster.exception.BusinessException;
import com.smartroster.exception.ResourceNotFoundException;
import com.smartroster.repository.EmployeeRepository;
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

    public UserService(UserRepository userRepository, EmployeeRepository employeeRepository) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    @PostConstruct
    @Transactional
    public void initDefaultUsers() {
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
            User manager = new User(
                    "manager",
                    "manager@smartroster.io",
                    SecurityUtils.hashPassword("manager123"),
                    "MANAGER",
                    "Shift Operations Manager",
                    "Operations"
            );
            userRepository.save(manager);

            // Seed Standard User
            User rahul = new User(
                    "rahul",
                    "rahul@smartroster.io",
                    SecurityUtils.hashPassword("user123"),
                    "USER",
                    "Rahul Sharma",
                    "Support & Operations"
            );
            userRepository.save(rahul);

            User priya = new User(
                    "priya",
                    "priya@smartroster.io",
                    SecurityUtils.hashPassword("user123"),
                    "USER",
                    "Priya Patel",
                    "Logistics"
            );
            userRepository.save(priya);
        }
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

        User user = new User(
                username,
                email,
                SecurityUtils.hashPassword(request.getPassword()),
                role,
                request.getFullName(),
                request.getDepartment() != null ? request.getDepartment() : "Operations"
        );
        user.setLastLoginAt(LocalDateTime.now());
        user = userRepository.save(user);

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

        User user = new User(
                username,
                email,
                SecurityUtils.hashPassword(request.getPassword()),
                role,
                request.getFullName(),
                request.getDepartment() != null ? request.getDepartment() : "Operations"
        );

        user = userRepository.save(user);
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
    public UserDTO toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        boolean newStatus = !Boolean.TRUE.equals(user.getActive());
        if (!newStatus && "ADMIN".equals(user.getRole())) {
            long activeAdmins = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equals(u.getRole()) && Boolean.TRUE.equals(u.getActive()) && !u.getId().equals(id))
                    .count();
            if (activeAdmins == 0) {
                throw new BusinessException("Cannot deactivate the only active system administrator.");
            }
        }

        user.setActive(newStatus);
        user = userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException("Password must be at least 6 characters.");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setPasswordHash(SecurityUtils.hashPassword(newPassword));
        userRepository.save(user);
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
}
