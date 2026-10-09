package com.smartroster.controller;

import com.smartroster.dto.AuthRequest;
import com.smartroster.dto.AuthResponse;
import com.smartroster.dto.CreateUserRequest;
import com.smartroster.dto.UserDTO;
import com.smartroster.exception.BusinessException;
import com.smartroster.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException("Missing or malformed Authorization header.");
        }
        String token = authHeader.substring(7);
        return ResponseEntity.ok(userService.getCurrentUser(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
