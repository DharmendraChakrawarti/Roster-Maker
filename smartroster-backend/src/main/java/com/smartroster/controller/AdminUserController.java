package com.smartroster.controller;

import com.smartroster.dto.AdminStatsDTO;
import com.smartroster.dto.CreateUserRequest;
import com.smartroster.dto.UpdateUserRequest;
import com.smartroster.dto.UserDTO;
import com.smartroster.exception.BusinessException;
import com.smartroster.security.SecurityUtils;
import com.smartroster.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    private void verifyAdmin(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            SecurityUtils.TokenPayload payload = SecurityUtils.verifyToken(token);
            if (payload != null && !"ADMIN".equalsIgnoreCase(payload.getRole())) {
                throw new BusinessException("Access denied: Administrative privileges required.");
            }
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDTO> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<UserDTO> toggleUserStatus(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        String newPassword = body.get("newPassword");
        userService.resetPassword(id, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getAdminStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdmin(authHeader);
        return ResponseEntity.ok(userService.getAdminStats());
    }
}
