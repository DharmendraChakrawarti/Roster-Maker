package com.smartroster.service;

import com.smartroster.dto.RosterDTO;
import com.smartroster.dto.RosterDTO.RosterAssignmentDTO;
import com.smartroster.dto.RosterDTO.EmployeeShiftSummary;
import com.smartroster.entity.ShiftConfig;
import com.smartroster.repository.ShiftConfigRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    private final RosterService rosterService;
    private final ShiftConfigRepository shiftConfigRepository;

    public ExcelExportService(RosterService rosterService, ShiftConfigRepository shiftConfigRepository) {
        this.rosterService = rosterService;
        this.shiftConfigRepository = shiftConfigRepository;
    }

    public byte[] exportRosterToExcel(Long rosterId) throws IOException {
        RosterDTO roster = rosterService.getRoster(rosterId);
        List<ShiftConfig> shiftConfigs = shiftConfigRepository.findByActiveTrueOrderByDisplayOrderAsc();

        // Build shift color map
        Map<String, String> shiftColorMap = new HashMap<>();
        for (ShiftConfig sc : shiftConfigs) {
            shiftColorMap.put(sc.getShiftName(), sc.getColorCode());
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // ===================== ROSTER SHEET =====================
            XSSFSheet rosterSheet = workbook.createSheet("Roster");

            YearMonth yearMonth = YearMonth.of(roster.getYear(), roster.getMonth());
            int daysInMonth = yearMonth.lengthOfMonth();
            String monthName = yearMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            // ---- Styles ----
            XSSFCellStyle titleStyle = createTitleStyle(workbook);
            XSSFCellStyle headerStyle = createHeaderStyle(workbook);
            XSSFCellStyle weekendHeaderStyle = createWeekendHeaderStyle(workbook);
            XSSFCellStyle nameStyle = createNameStyle(workbook);
            XSSFCellStyle offStyle = createOffStyle(workbook);
            XSSFCellStyle borderStyle = createBorderStyle(workbook);

            // Shift-specific styles with colors
            Map<String, XSSFCellStyle> shiftStyles = new HashMap<>();
            for (ShiftConfig sc : shiftConfigs) {
                shiftStyles.put(sc.getShiftName(), createShiftStyle(workbook, sc.getColorCode()));
            }

            // ---- Title Row ----
            int rowIdx = 0;
            XSSFRow titleRow = rosterSheet.createRow(rowIdx);
            titleRow.setHeightInPoints(30);
            XSSFCell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("SmartRoster — Employee Shift Roster");
            titleCell.setCellStyle(titleStyle);
            rosterSheet.addMergedRegion(new CellRangeAddress(0, 0, 0, daysInMonth + 1));

            // ---- Month/Year Row ----
            rowIdx++;
            XSSFRow monthRow = rosterSheet.createRow(rowIdx);
            monthRow.setHeightInPoints(22);
            XSSFCell monthCell = monthRow.createCell(0);
            monthCell.setCellValue(monthName + " " + roster.getYear());
            XSSFCellStyle monthStyle = workbook.createCellStyle();
            XSSFFont monthFont = workbook.createFont();
            monthFont.setBold(true);
            monthFont.setFontHeightInPoints((short) 13);
            monthFont.setColor(new XSSFColor(new byte[]{85, 85, 85}, null));
            monthStyle.setFont(monthFont);
            monthCell.setCellStyle(monthStyle);
            rosterSheet.addMergedRegion(new CellRangeAddress(1, 1, 0, daysInMonth + 1));

            // ---- Day of Week Header ----
            rowIdx++;
            XSSFRow dowRow = rosterSheet.createRow(rowIdx);
            dowRow.setHeightInPoints(18);
            XSSFCell dowLabelCell = dowRow.createCell(0);
            dowLabelCell.setCellValue("Day");
            dowLabelCell.setCellStyle(headerStyle);

            for (int d = 1; d <= daysInMonth; d++) {
                LocalDate date = LocalDate.of(roster.getYear(), roster.getMonth(), d);
                DayOfWeek dow = date.getDayOfWeek();
                boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);
                XSSFCell cell = dowRow.createCell(d);
                cell.setCellValue(dow.getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                cell.setCellStyle(isWeekend ? weekendHeaderStyle : headerStyle);
            }

            // ---- Date Header ----
            rowIdx++;
            XSSFRow dateRow = rosterSheet.createRow(rowIdx);
            dateRow.setHeightInPoints(18);
            XSSFCell dateLabelCell = dateRow.createCell(0);
            dateLabelCell.setCellValue("Employee / Date");
            dateLabelCell.setCellStyle(headerStyle);

            for (int d = 1; d <= daysInMonth; d++) {
                LocalDate date = LocalDate.of(roster.getYear(), roster.getMonth(), d);
                boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);
                XSSFCell cell = dateRow.createCell(d);
                cell.setCellValue(d);
                cell.setCellStyle(isWeekend ? weekendHeaderStyle : headerStyle);
            }

            // ---- Build employee-date-shift lookup ----
            // Map: employeeName -> (date -> shiftName or "OFF")
            Map<String, Map<String, String>> employeeSchedule = new LinkedHashMap<>();
            Set<String> allEmployeeNames = new LinkedHashSet<>();

            for (RosterAssignmentDTO a : roster.getAssignments()) {
                allEmployeeNames.add(a.getEmployeeName());
                employeeSchedule.computeIfAbsent(a.getEmployeeName(), k -> new HashMap<>());
                if (a.getIsWeeklyOff()) {
                    employeeSchedule.get(a.getEmployeeName()).put(a.getAssignmentDate(), "OFF");
                } else if (a.getShiftName() != null) {
                    employeeSchedule.get(a.getEmployeeName()).put(a.getAssignmentDate(), a.getShiftName());
                }
            }

            // ---- Employee Rows ----
            List<String> sortedNames = new ArrayList<>(allEmployeeNames);
            Collections.sort(sortedNames);

            for (String empName : sortedNames) {
                rowIdx++;
                XSSFRow empRow = rosterSheet.createRow(rowIdx);
                empRow.setHeightInPoints(20);

                XSSFCell nameCell = empRow.createCell(0);
                nameCell.setCellValue(empName);
                nameCell.setCellStyle(nameStyle);

                Map<String, String> schedule = employeeSchedule.getOrDefault(empName, new HashMap<>());

                for (int d = 1; d <= daysInMonth; d++) {
                    LocalDate date = LocalDate.of(roster.getYear(), roster.getMonth(), d);
                    String dateStr = date.toString();
                    String value = schedule.getOrDefault(dateStr, "");

                    XSSFCell cell = empRow.createCell(d);
                    cell.setCellValue(value);

                    if ("OFF".equals(value)) {
                        cell.setCellStyle(offStyle);
                    } else if (shiftStyles.containsKey(value)) {
                        cell.setCellStyle(shiftStyles.get(value));
                    } else {
                        cell.setCellStyle(borderStyle);
                    }
                }
            }

            // ---- Legend Row ----
            rowIdx += 2;
            XSSFRow legendTitleRow = rosterSheet.createRow(rowIdx);
            XSSFCell legendTitleCell = legendTitleRow.createCell(0);
            legendTitleCell.setCellValue("Shift Legend:");
            legendTitleCell.setCellStyle(headerStyle);

            rowIdx++;
            for (ShiftConfig sc : shiftConfigs) {
                XSSFRow legendRow = rosterSheet.createRow(rowIdx);
                XSSFCell colorCell = legendRow.createCell(0);
                colorCell.setCellValue(sc.getShiftName());
                colorCell.setCellStyle(shiftStyles.get(sc.getShiftName()));

                XSSFCell descCell = legendRow.createCell(1);
                descCell.setCellValue(String.format("Weekday: %d, Weekend: %d employees",
                        sc.getWeekdayCount(), sc.getWeekendCount()));
                rosterSheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 1, 4));
                rowIdx++;
            }

            // OFF legend
            XSSFRow offLegendRow = rosterSheet.createRow(rowIdx);
            XSSFCell offColorCell = offLegendRow.createCell(0);
            offColorCell.setCellValue("OFF");
            offColorCell.setCellStyle(offStyle);
            XSSFCell offDescCell = offLegendRow.createCell(1);
            offDescCell.setCellValue("Weekly Off");

            // ---- Column widths ----
            rosterSheet.setColumnWidth(0, 22 * 256); // Employee name column
            for (int d = 1; d <= daysInMonth; d++) {
                rosterSheet.setColumnWidth(d, 6 * 256); // Date columns
            }

            // ---- Freeze panes: freeze first column and first 4 rows ----
            rosterSheet.createFreezePane(1, 4);

            // ===================== SUMMARY SHEET =====================
            XSSFSheet summarySheet = workbook.createSheet("Summary");

            // Summary title
            rowIdx = 0;
            XSSFRow summTitleRow = summarySheet.createRow(rowIdx);
            summTitleRow.setHeightInPoints(28);
            XSSFCell summTitleCell = summTitleRow.createCell(0);
            summTitleCell.setCellValue("Employee Shift Summary — " + monthName + " " + roster.getYear());
            summTitleCell.setCellStyle(titleStyle);

            // Headers
            rowIdx++;
            XSSFRow summHeaderRow = summarySheet.createRow(rowIdx);
            summHeaderRow.setHeightInPoints(20);

            String[] summHeaders = buildSummaryHeaders(shiftConfigs);
            for (int i = 0; i < summHeaders.length; i++) {
                XSSFCell cell = summHeaderRow.createCell(i);
                cell.setCellValue(summHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            // Summary data
            if (roster.getEmployeeSummary() != null) {
                List<Map.Entry<String, EmployeeShiftSummary>> summaryEntries =
                        new ArrayList<>(roster.getEmployeeSummary().entrySet());
                summaryEntries.sort(Comparator.comparing(e -> e.getValue().getEmployeeName()));

                for (Map.Entry<String, EmployeeShiftSummary> entry : summaryEntries) {
                    rowIdx++;
                    EmployeeShiftSummary summary = entry.getValue();
                    XSSFRow dataRow = summarySheet.createRow(rowIdx);

                    int col = 0;
                    XSSFCell nameDataCell = dataRow.createCell(col++);
                    nameDataCell.setCellValue(summary.getEmployeeName());
                    nameDataCell.setCellStyle(nameStyle);

                    for (ShiftConfig sc : shiftConfigs) {
                        XSSFCell shiftCell = dataRow.createCell(col++);
                        int count = summary.getShiftCounts() != null ?
                                summary.getShiftCounts().getOrDefault(sc.getShiftName(), 0) : 0;
                        shiftCell.setCellValue(count);
                        shiftCell.setCellStyle(shiftStyles.get(sc.getShiftName()));
                    }

                    XSSFCell totalCell = dataRow.createCell(col++);
                    totalCell.setCellValue(summary.getTotalAssignments());
                    totalCell.setCellStyle(borderStyle);

                    XSSFCell offCell = dataRow.createCell(col++);
                    offCell.setCellValue(summary.getTotalWeeklyOffs());
                    offCell.setCellStyle(offStyle);
                }
            }

            // Summary column widths
            summarySheet.setColumnWidth(0, 22 * 256);
            for (int i = 1; i < summHeaders.length; i++) {
                summarySheet.setColumnWidth(i, 14 * 256);
            }

            // Freeze header row
            summarySheet.createFreezePane(0, 2);

            // Merge summary title
            summarySheet.addMergedRegion(new CellRangeAddress(0, 0, 0, summHeaders.length - 1));

            // Write to byte array
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String[] buildSummaryHeaders(List<ShiftConfig> shiftConfigs) {
        List<String> headers = new ArrayList<>();
        headers.add("Employee");
        for (ShiftConfig sc : shiftConfigs) {
            headers.add(sc.getShiftName());
        }
        headers.add("Total Shifts");
        headers.add("Weekly Offs");
        return headers.toArray(new String[0]);
    }

    // ===================== STYLE HELPERS =====================

    private XSSFCellStyle createTitleStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(new XSSFColor(new byte[]{33, 33, 33}, null));
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private XSSFCellStyle createHeaderStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(new XSSFColor(new byte[]{(byte) 254, (byte) 250, (byte) 243}, null)); // #FEFAF3
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 132, (byte) 162, (byte) 130}, null)); // #84A282
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createWeekendHeaderStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(new XSSFColor(new byte[]{(byte) 90, (byte) 38, (byte) 54}, null));
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 246, (byte) 226, (byte) 233}, null)); // #F6E2E9
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createNameStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(new XSSFColor(new byte[]{(byte) 25, (byte) 35, (byte) 28}, null));
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 235, (byte) 242, (byte) 233}, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createOffStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 9);
        font.setColor(new XSSFColor(new byte[]{(byte) 90, (byte) 38, (byte) 54}, null));
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 246, (byte) 226, (byte) 233}, null)); // #F6E2E9
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createBorderStyle(XSSFWorkbook workbook) {
        XSSFCellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private XSSFCellStyle createShiftStyle(XSSFWorkbook workbook, String hexColor) {
        XSSFCellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 9);

        try {
            // Parse hex color like "#4CAF50"
            String hex = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
            int r = Integer.parseInt(hex.substring(0, 2), 16);
            int g = Integer.parseInt(hex.substring(2, 4), 16);
            int b = Integer.parseInt(hex.substring(4, 6), 16);

            // Light background version of the color
            int lr = Math.min(255, r + (255 - r) * 7 / 10);
            int lg = Math.min(255, g + (255 - g) * 7 / 10);
            int lb = Math.min(255, b + (255 - b) * 7 / 10);

            style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) lr, (byte) lg, (byte) lb}, null));
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Dark text
            font.setColor(new XSSFColor(new byte[]{(byte) (r / 2), (byte) (g / 2), (byte) (b / 2)}, null));
        } catch (Exception e) {
            // Fallback to green
            style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 200, (byte) 230, (byte) 201}, null));
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }

        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}
