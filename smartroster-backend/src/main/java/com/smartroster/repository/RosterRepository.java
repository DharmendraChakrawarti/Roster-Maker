package com.smartroster.repository;

import com.smartroster.entity.Roster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface RosterRepository extends JpaRepository<Roster, Long> {
    Optional<Roster> findByMonthAndYear(Integer month, Integer year);
    List<Roster> findAllByOrderByYearDescMonthDesc();
}
