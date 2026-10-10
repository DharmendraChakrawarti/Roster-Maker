package com.smartroster.service;

import com.smartroster.dto.*;
import com.smartroster.entity.User;
import com.smartroster.repository.UserRepository;
import com.smartroster.security.SecurityUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Verify default users are seeded and can login")
    void testDefaultAdminAndUserLogin() {
        // Ensure dc user exists with known password
        User dc = userRepository.findByUsernameIgnoreCase("dc").orElseGet(() -> {
            User u = new User("dc", "dc@smartroster.io", SecurityUtils.hashPassword("dc123"), "ADMIN", "Dharmendra Chakrawarti", "Engineering & Management");
            return userRepository.save(u);
        });
        dc.setPasswordHash(SecurityUtils.hashPassword("dc123"));
        dc.setActive(true);
        userRepository.save(dc);

        // Ensure rahul user exists with known password
        User rahul = userRepository.findByUsernameIgnoreCase("rahul").orElseGet(() -> {
            User u = new User("rahul", "rahul@smartroster.io", SecurityUtils.hashPassword("user123"), "USER", "Rahul Sharma", "Support & Operations");
            return userRepository.save(u);
        });
        rahul.setPasswordHash(SecurityUtils.hashPassword("user123"));
        rahul.setActive(true);
        userRepository.save(rahul);

        // Test DC admin login
        AuthRequest dcReq = new AuthRequest("dc", "dc123");
        AuthResponse dcRes = userService.login(dcReq);
        assertNotNull(dcRes);
        assertNotNull(dcRes.getToken());
        assertEquals("dc", dcRes.getUser().getUsername());
        assertEquals("ADMIN", dcRes.getUser().getRole());

        // Test staff user login
        AuthRequest rahulReq = new AuthRequest("rahul", "user123");
        AuthResponse rahulRes = userService.login(rahulReq);
        assertNotNull(rahulRes);
        assertEquals("rahul", rahulRes.getUser().getUsername());
        assertEquals("USER", rahulRes.getUser().getRole());
    }

    @Test
    @DisplayName("Verify admin user management operations")
    void testAdminUserManagement() {
        // 1. Get all users
        List<UserDTO> allUsers = userService.getAllUsers();
        assertTrue(allUsers.size() >= 1);

        // 2. Create new user
        CreateUserRequest createReq = new CreateUserRequest();
        createReq.setUsername("testemp_" + System.currentTimeMillis());
        createReq.setEmail("testemp_" + System.currentTimeMillis() + "@smartroster.io");
        createReq.setPassword("empPass123");
        createReq.setFullName("Test Employee");
        createReq.setRole("USER");
        createReq.setDepartment("Logistics");

        UserDTO created = userService.createUser(createReq);
        assertNotNull(created);
        assertEquals("Logistics", created.getDepartment());

        // 3. Update user
        UpdateUserRequest updateReq = new UpdateUserRequest();
        updateReq.setDepartment("Supply Chain");
        updateReq.setRole("MANAGER");
        UserDTO updated = userService.updateUser(created.getId(), updateReq);
        assertEquals("Supply Chain", updated.getDepartment());
        assertEquals("MANAGER", updated.getRole());

        // 4. Toggle status
        UserDTO toggled = userService.toggleUserStatus(created.getId());
        assertFalse(toggled.getActive());

        // 5. Reset password
        userService.resetPassword(created.getId(), "newSecret456");

        // 6. Verify stats
        AdminStatsDTO stats = userService.getAdminStats();
        assertNotNull(stats);
        assertTrue(stats.getTotalUsers() > 0);
    }

    @Test
    @DisplayName("Verify manager registration and staff assignment under manager")
    void testManagerAndStaffRegistration() {
        long ts = System.currentTimeMillis();
        // 1. Register a new Manager
        CreateUserRequest managerReq = new CreateUserRequest();
        managerReq.setUsername("alex_mgr_" + ts);
        managerReq.setPassword("alexPass123");
        managerReq.setFullName("Alex Morgan");
        managerReq.setEmail("alex_" + ts + "@smartroster.io");
        managerReq.setRole("MANAGER");
        managerReq.setDepartment("Operations Beta");

        AuthResponse mgrRes = userService.register(managerReq);
        assertNotNull(mgrRes);
        assertEquals("MANAGER", mgrRes.getUser().getRole());
        assertEquals("Alex Morgan", mgrRes.getUser().getFullName());

        // Verify manager appears in active managers list
        List<ManagerSummaryDTO> activeManagers = userService.getActiveManagers();
        assertTrue(activeManagers.stream().anyMatch(m -> m.getId().equals(mgrRes.getUser().getId())));

        // 2. Register a Staff member reporting to Alex Morgan
        CreateUserRequest staffReq = new CreateUserRequest();
        staffReq.setUsername("sam_staff_" + ts);
        staffReq.setPassword("samPass123");
        staffReq.setFullName("Sam Staff");
        staffReq.setEmail("sam_" + ts + "@smartroster.io");
        staffReq.setRole("USER");
        staffReq.setDepartment("Operations Beta");
        staffReq.setManagerId(mgrRes.getUser().getId());

        AuthResponse staffRes = userService.register(staffReq);
        assertNotNull(staffRes);
        assertEquals("USER", staffRes.getUser().getRole());
        assertEquals(mgrRes.getUser().getId(), staffRes.getUser().getManagerId());
        assertEquals("Alex Morgan", staffRes.getUser().getManagerName());
    }
}
