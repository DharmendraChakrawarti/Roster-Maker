package com.smartroster.repository;

import com.smartroster.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByOrderByCreatedAtDesc();

    List<User> findByRoleAndActiveTrueOrderByFullNameAsc(String role);

    List<User> findByRoleInAndActiveTrueOrderByFullNameAsc(List<String> roles);

    List<User> findByManagerId(Long managerId);

    long countByRole(String role);

    long countByActiveTrue();
}
