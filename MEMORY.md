# SmartRoster - Project Memory File
> This file captures key project details to save context across sessions.

## Project Overview
- **Type**: Full-stack web app (Spring Boot + Angular)
- **Location**: `/home/dc/Projects/Roaster maker/`
- **Backend**: `smartroster-backend/` — Spring Boot 3.2.5, Java 21, H2 database, Flyway migrations
- **Frontend**: `smartroster-frontend/` — Angular 17, standalone components

## How to Run
```bash
# Backend (port 8080)
cd smartroster-backend && mvn spring-boot:run

# Frontend (port 4200)
cd smartroster-frontend && npm start
```

## Color Palette
| Name       | Hex       | Usage                      |
|------------|-----------|----------------------------|
| Sage       | `#84A282` | Primary accent, buttons     |
| Sage Light | `#B8CFB3` | Secondary accent, text      |
| Cream      | `#FEFAF3` | Text primary, light bg      |
| Blush      | `#F6E2E9` | Weekly OFF, danger accent   |

## Architecture

### Backend Key Files
| File | Purpose |
|------|---------|
| `service/RosterService.java` | Core roster generation algorithm, weekly off planning, CRUD |
| `controller/RosterController.java` | REST API endpoints |
| `entity/Roster.java` | Roster entity (month, year, status, weeklyOffPerEmployee) |
| `entity/RosterAssignment.java` | Per-employee per-day shift assignment |
| `entity/Employee.java` | Employee entity (name, active) |
| `entity/ShiftConfig.java` | Shift config (name, weekday/weekend count, colorCode) |
| `service/ExcelExportService.java` | Excel export functionality |
| `repository/RosterAssignmentRepository.java` | Has `deleteByRosterId()` and unique constraint on (roster_id, employee_id, assignment_date) |

### Frontend Key Files
| File | Purpose |
|------|---------|
| `components/roster/roster.component.ts` | Main roster grid, analytics, daily coverage tabs (inline template+styles) |
| `components/dashboard/dashboard.component.ts` | Dashboard overview |
| `components/employee/employee.component.ts` | Employee CRUD |
| `components/shift-config/shift-config.component.ts` | Shift configuration CRUD |
| `services/roster.service.ts` | HTTP client for roster APIs |
| `models/models.ts` | TypeScript interfaces |
| `styles.css` | Global CSS with design system variables |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rosters` | List all rosters |
| GET | `/api/rosters/{id}` | Get roster by ID (with assignments) |
| GET | `/api/rosters/by-month?month=&year=` | Get roster by month/year |
| POST | `/api/rosters/generate` | Generate/regenerate roster |
| PUT | `/api/rosters/{id}/assignments` | Update assignments |
| PUT | `/api/rosters/{id}/finalize` | Finalize roster |
| GET | `/api/rosters/{id}/export` | Export to Excel |
| DELETE | `/api/rosters/{id}` | Delete roster |
| GET/POST/PUT/DELETE | `/api/employees` | Employee CRUD |
| GET/POST/PUT/DELETE | `/api/shifts` | Shift config CRUD |

### Database
- **Type**: H2 file-based (`./data/smartroster`)
- **Migration**: Flyway `V1__initial_schema.sql`
- **Unique constraint**: `uk_roster_emp_date` on `roster_assignments(roster_id, employee_id, assignment_date)`
- The generate endpoint handles re-generation by deleting existing assignments before creating new ones.

## Key Design Decisions
1. **Shift display**: 2-character abbreviation (e.g., "MO", "EV", "NI") in grid cells
2. **Weekly offs**: Strictly consecutive 2-day offs (back-to-back) distributed smoothly across all 7 days of the week (`pattern = i % 7`) to prevent day clustering and ensure continuous staffing coverage
3. **Rest rule**: Enforces rest constraint (employees working Night shift on day d-1 cannot be assigned Morning shift on day d)
4. **Consecutive work limit**: Maximum 5-6 consecutive work days guaranteed by 7-day cyclical off distribution
5. **Roster regeneration**: Confirms with user if roster already exists for selected month
6. **Remove roster**: Available for all rosters (draft or finalized) via delete button
7. **Dark theme**: Uses sage/cream/blush palette (`#84A282`, `#B8CFB3`, `#FEFAF3`, `#F6E2E9`)
8. **Roster states**: DRAFT → FINALIZED (finalized locks editing)

## Known Patterns & Gotchas
- Backend uses `saveAndFlush()` + `deleteByRosterId()` + `flush()` before inserting new assignments to avoid unique constraint violations
- Shift assignment prioritizes Morning candidates first to satisfy Night->Morning rest constraints without employee starvation
- Full validation engine verifies: daily staffing counts per shift, duplicate assignments, rest rule violations, and max consecutive work days
- Frontend uses inline templates and styles in Angular standalone components
- The `selectedMonth` ngModel binds as number via `[value]` not `[ngValue]` — be careful with type coercion
- H2 database files are in `smartroster-backend/data/` directory
