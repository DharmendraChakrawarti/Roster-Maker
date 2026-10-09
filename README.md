# 📋 SmartRoster - Company Shift Roster Management System

SmartRoster is a complete, enterprise-grade monthly employee shift roster management application built for IT and operational companies. It automatically balances shift schedules, respects weekday vs. weekend staffing constraints, ensures equitable night shift and weekly off distributions, allows real-time interactive adjustments, and exports professional Excel spreadsheets formatted with Apache POI.

---

## 🌟 Key Features

1. **Employee Management**
   - Bulk copy-paste employee names (one per line).
   - CSV and Excel file import support.
   - Individual add, edit, and toggle active status.
   - Real-time search and filtering.

2. **Shift Configuration**
   - Customizable shift definitions (e.g. *Morning*, *Evening*, *Night*).
   - Independent staffing requirements for **Monday–Friday (Weekdays)** vs. **Saturday–Sunday (Weekends)**.
   - Color code picker for visual distinction in the calendar matrix.
   - Live daily staff requirement metrics.

3. **Smart Roster Generator & Constraint Solver**
   - **Automated Scheduling Algorithm**:
     - Guarantees 1 or 2 weekly offs per employee.
     - Enforces rest period rules (e.g., prevents Morning shift immediately following a Night shift).
     - Balances weekend work and night shifts across the entire team for fairness.
     - Guarantees weekday and weekend shift coverage demands.
   - Automated constraint validation warning alerts if staffing shortage occurs.

4. **Interactive Monthly Calendar Grid**
   - Sticky employee column with avatars and monthly summary counters.
   - Weekend columns (Saturday / Sunday) with distinct styling.
   - Click any cell to modify shift or toggle Weekly OFF with instant recalculations.
   - Shift Swapping and manual override indicators.
   - Daily coverage footer row showing live required vs. assigned staff count with deficit highlights.

5. **Fairness & Workload Analytics**
   - Visual shift distribution progress bars.
   - Average shifts and weekly offs per employee.
   - Per-employee shift-type breakdown table.

6. **Apache POI Excel Export**
   - Styled monthly grid workbook with custom color headers, borders, and weekend highlights.
   - Secondary summary sheet with per-employee shift breakdown and statistics.

---

## 🛠️ Technology Stack

- **Frontend**: Angular 17 (Standalone Components, TypeScript, Modern Dark Glassmorphic Design)
- **Backend**: Java 21, Spring Boot 3.2 (Spring Data JPA, Hibernate, Flyway Migrations, Validation)
- **Database**: PostgreSQL / H2 In-Memory (compatible fallback for quick development)
- **Spreadsheet Generation**: Apache POI 5.2.5 (`poi` & `poi-ooxml`)
- **Build Tools**: Maven & NPM

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 21** (`java -version`)
- **Maven 3.8+** (`mvn -version`)
- **Node.js 18+** & **NPM** (`node -v`, `npm -v`)
- **PostgreSQL 14+** (Optional: defaults to in-memory/PostgreSQL profile)

---

### 1. Start the Backend

```bash
cd smartroster-backend
mvn spring-boot:run
```
*The backend REST API will start at `http://localhost:8080`.*

---

### 2. Start the Frontend

```bash
cd smartroster-frontend
npm install
npm start
```
*The Angular web application will start at `http://localhost:4200`.*

---

## 📁 Architecture Overview

```
Roaster maker/
├── smartroster-backend/
│   ├── src/main/java/com/smartroster/
│   │   ├── config/             # CORS & App configurations
│   │   ├── controller/         # REST endpoints (Employees, Shifts, Rosters)
│   │   ├── dto/                # Request & Response DTOs
│   │   ├── entity/             # JPA Entities (Employee, ShiftConfig, Roster, RosterAssignment)
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   └── service/            # Roster Generation Engine & Excel Export Service
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/       # Flyway database schemas
└── smartroster-frontend/
    ├── src/app/
    │   ├── components/
    │   │   ├── dashboard/      # Overview metrics & quick roster launcher
    │   │   ├── employees/      # Bulk paste, CSV import & employee list
    │   │   ├── shift-config/   # Shift editor & weekday/weekend staffing rules
    │   │   └── roster/         # Monthly grid, fairness analytics & Excel download
    │   ├── models/             # TypeScript data contracts
    │   └── services/           # Angular HTTP API services
    └── src/styles.css          # Design system & dark theme tokens
```
