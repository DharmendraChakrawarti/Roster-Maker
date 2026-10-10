package com.smartroster.controller;

import com.smartroster.dto.ContinuityContextDTO;
import com.smartroster.dto.GenerateRosterRequest;
import com.smartroster.dto.RosterDTO;
import com.smartroster.dto.UpdateAssignmentsRequest;
import com.smartroster.entity.User;
import com.smartroster.security.AuthHelper;
import com.smartroster.service.ExcelExportService;
import com.smartroster.service.RosterService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/rosters")
public class RosterController {

    private final RosterService rosterService;
    private final ExcelExportService excelExportService;
    private final AuthHelper authHelper;

    public RosterController(RosterService rosterService,
                            ExcelExportService excelExportService,
                            AuthHelper authHelper) {
        this.rosterService = rosterService;
        this.excelExportService = excelExportService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<List<RosterDTO>> getAllRosters(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Long managerId) {
        User user = authHelper.resolveUser(authHeader);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, managerId);
        if ("ADMIN".equalsIgnoreCase(user.getRole()) && managerId == null) {
            return ResponseEntity.ok(rosterService.getAllRosters());
        }
        return ResponseEntity.ok(rosterService.getAllRosters(targetManagerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RosterDTO> getRoster(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Any authenticated role (Admin, Manager, Staff) can view the roster details
        return ResponseEntity.ok(rosterService.getRoster(id));
    }

    @GetMapping("/by-month")
    public ResponseEntity<RosterDTO> getRosterByMonth(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Long managerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, managerId);
        return ResponseEntity.ok(rosterService.getRosterByMonthYear(month, year, targetManagerId));
    }

    @GetMapping("/continuity-context")
    public ResponseEntity<ContinuityContextDTO> getContinuityContext(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Long managerId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        Long targetManagerId = authHelper.resolveTargetManagerId(user, managerId);
        return ResponseEntity.ok(rosterService.getContinuityContext(month, year, targetManagerId));
    }

    @PostMapping("/generate")
    public ResponseEntity<RosterDTO> generateRoster(
            @Valid @RequestBody GenerateRosterRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);

        Long targetManagerId = authHelper.resolveTargetManagerId(user, request.getManagerId());
        String managerName = user.getFullName();
        return ResponseEntity.ok(rosterService.generateRoster(request, targetManagerId, managerName));
    }

    @PutMapping("/{id}/assignments")
    public ResponseEntity<RosterDTO> updateAssignments(
            @PathVariable Long id,
            @RequestBody UpdateAssignmentsRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        return ResponseEntity.ok(rosterService.updateAssignments(id, request));
    }

    @PutMapping("/{id}/finalize")
    public ResponseEntity<RosterDTO> finalizeRoster(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        return ResponseEntity.ok(rosterService.finalizeRoster(id));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportToExcel(@PathVariable Long id) throws IOException {
        RosterDTO roster = rosterService.getRoster(id);
        byte[] excelData = excelExportService.exportRosterToExcel(id);

        YearMonth ym = YearMonth.of(roster.getYear(), roster.getMonth());
        String monthName = ym.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String filename = String.format("SmartRoster_%s_%d.xlsx", monthName, roster.getYear());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(filename).build());
        headers.setContentLength(excelData.length);

        return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoster(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User user = authHelper.resolveUser(authHeader);
        authHelper.requireManagerOrAdmin(user);
        rosterService.deleteRoster(id);
        return ResponseEntity.noContent().build();
    }
}
