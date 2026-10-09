package com.smartroster.service;

import com.smartroster.dto.*;
import com.smartroster.entity.User;
import com.smartroster.repository.UserRepository;
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
        assertTrue(allUsers.size() >= 3);

        // 2. Create new user
        CreateUserRequest createReq = new CreateUserRequest();
        createReq.setUsername("testemp");
        createReq.setEmail("testemp@smartroster.io");
        createReq.setPassword("empPass123");
        createReq.setFullName("Test Employee");
        createReq.setRole("USER");
        createReq.setDepartment("Logistics");

        UserDTO created = userService.createUser(createReq);
        assertNotNull(created);
        assertEquals("testemp", created.getUsername());
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
        assertTrue(stats.getAdminCount() >= 1);
    }
}
