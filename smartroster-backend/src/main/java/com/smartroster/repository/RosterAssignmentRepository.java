package com.smartroster.repository;

import com.smartroster.entity.RosterAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RosterAssignmentRepository extends JpaRepository<RosterAssignment, Long> {

    List<RosterAssignment> findByRosterId(Long rosterId);

    @Query("SELECT ra FROM RosterAssignment ra JOIN FETCH ra.employee WHERE ra.roster.id = :rosterId ORDER BY ra.employee.name, ra.assignmentDate")
    List<RosterAssignment> findByRosterIdWithEmployee(@Param("rosterId") Long rosterId);

    @Modifying(clearAutomatically = false, flushAutomatically = true)
    @Query("DELETE FROM RosterAssignment ra WHERE ra.roster.id = :rosterId")
    void deleteByRosterId(@Param("rosterId") Long rosterId);
}

