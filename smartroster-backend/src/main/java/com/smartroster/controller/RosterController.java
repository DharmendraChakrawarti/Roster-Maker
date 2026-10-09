package com.smartroster.controller;

import com.smartroster.dto.ContinuityContextDTO;
import com.smartroster.dto.GenerateRosterRequest;
import com.smartroster.dto.RosterDTO;
import com.smartroster.dto.UpdateAssignmentsRequest;
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

    public RosterController(RosterService rosterService, ExcelExportService excelExportService) {
        this.rosterService = rosterService;
        this.excelExportService = excelExportService;
    }

    @GetMapping
    public ResponseEntity<List<RosterDTO>> getAllRosters() {
        return ResponseEntity.ok(rosterService.getAllRosters());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RosterDTO> getRoster(@PathVariable Long id) {
        return ResponseEntity.ok(rosterService.getRoster(id));
    }

    @GetMapping("/by-month")
    public ResponseEntity<RosterDTO> getRosterByMonth(@RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(rosterService.getRosterByMonthYear(month, year));
    }

    @GetMapping("/continuity-context")
    public ResponseEntity<ContinuityContextDTO> getContinuityContext(@RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(rosterService.getContinuityContext(month, year));
    }

    @PostMapping("/generate")
    public ResponseEntity<RosterDTO> generateRoster(@Valid @RequestBody GenerateRosterRequest request) {
        return ResponseEntity.ok(rosterService.generateRoster(request));
    }

    @PutMapping("/{id}/assignments")
    public ResponseEntity<RosterDTO> updateAssignments(@PathVariable Long id,
                                                       @RequestBody UpdateAssignmentsRequest request) {
        return ResponseEntity.ok(rosterService.updateAssignments(id, request));
    }

    @PutMapping("/{id}/finalize")
    public ResponseEntity<RosterDTO> finalizeRoster(@PathVariable Long id) {
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
    public ResponseEntity<Void> deleteRoster(@PathVariable Long id) {
        rosterService.deleteRoster(id);
        return ResponseEntity.noContent().build();
    }
}
