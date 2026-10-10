# 📋 SmartRoster - Company Shift Roster Management System

SmartRoster is a complete, enterprise-grade monthly employee shift roster management application built for IT and operational companies. It automatically balances shift schedules, respects weekday vs. weekend staffing constraints, ensures equitable night shift and weekly off distributions, enforces multi-tenant role isolation (Admin, Manager, Staff), allows real-time interactive adjustments, and exports professional Excel spreadsheets formatted with Apache POI.

---

## 🌟 Key Features

1. **Role-Based Multi-Tenancy & Access Control**
   - **System Admin (`ADMIN`)**: Full platform governance, user management, department management, global analytics.
   - **Shift Manager (`MANAGER`)**: Isolated private workspace to configure shifts, manage department staff, generate automated rosters, and export schedules.
   - **Staff Member (`USER`)**: View-only personal and team monthly roster with highlighted personal shift assignments.

2. **Employee & Department Management**
   - Manage departments (IT, Operations, Logistics, Engineering, Support, etc.).
   - Bulk copy-paste employee names (one per line).
   - CSV and Excel file import support.
   - Individual add, edit, and toggle active status.
   - Real-time search and filtering.

3. **Shift Configuration**
   - Customizable shift definitions (e.g. *Morning*, *Evening*, *Night*).
   - Independent staffing requirements for **Monday–Friday (Weekdays)** vs. **Saturday–Sunday (Weekends)**.
   - Color code picker for visual distinction in the calendar matrix.
   - Live daily staff requirement metrics.

4. **Smart Roster Generator & Constraint Solver**
   - **Automated Scheduling Algorithm**:
     - Strict 5-day work week enforcement (guarantees no employee works > 5 consecutive days).
     - Multi-month continuity solver inspecting predecessor months to prevent boundary streak violations.
     - Enforces rest period rules (e.g., prevents Morning shift immediately following a Night shift).
     - Balances weekend work and night shifts across the entire team for fairness.
     - Guarantees weekday and weekend shift coverage demands.
   - Collapsible **Roster Optimization Notices** accordion highlighting fairness and distribution details.

5. **Interactive Monthly Calendar Grid & Mobile Responsive**
   - Mobile-first, fully responsive design with smooth sidebars and touch-friendly controls.
   - Sticky employee column with avatars and monthly summary counters.
   - Weekend columns (Saturday / Sunday) with distinct styling.
   - Click any cell to modify shift or toggle Weekly OFF with instant recalculations.
   - Shift Swapping and manual override indicators.
   - Daily coverage footer row showing live required vs. assigned staff count with deficit highlights.

6. **Fairness & Workload Analytics**
   - Visual shift distribution progress bars.
   - Average shifts and weekly offs per employee.
   - Per-employee shift-type breakdown table.

7. **Apache POI Excel Export**
   - Styled monthly grid workbook with custom color headers, borders, and weekend highlights.
   - Secondary summary sheet with per-employee shift breakdown and statistics.

---

## 🛠️ Technology Stack

- **Frontend**: Angular 17 (Standalone Components, TypeScript, Responsive Dark Glassmorphic Design)
- **Backend**: Java 21, Spring Boot 3.2 (Spring Data JPA, Hibernate, Flyway Migrations, Validation)
- **Database**: PostgreSQL / H2 In-Memory (compatible fallback for zero-config instant deployment)
- **Spreadsheet Generation**: Apache POI 5.2.5 (`poi` & `poi-ooxml`)
- **Containerization**: Multi-stage Docker build packaging frontend & backend into a single lean container.

---

## 🌐 100% Free Cloud Deployment Guide

SmartRoster includes a unified multi-stage `Dockerfile` that packages the Angular frontend inside the Spring Boot JAR into a single lightweight container.

### Option 1: Deploy on Render.com (Recommended - 100% Free)

Render provides free Docker web services that sleep on inactivity and wake up automatically on request.

1. **Sign Up / Log In**: Go to [render.com](https://render.com) and log in with your GitHub account.
2. **Create New Web Service**:
   - Click **New +** -> **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect your repository: `DharmendraChakrawarti/Roster-Maker`.
3. **Configure Settings**:
   - **Name**: `smartroster` (or any custom name)
   - **Region**: Choose closest to you (e.g. *Oregon* or *Frankfurt*)
   - **Branch**: `main`
   - **Runtime / Environment**: **Docker** (it will automatically detect the `Dockerfile`)
   - **Instance Type**: **Free** ($0 / month)
4. **Environment Variables** (Optional, defaults work out-of-the-box):
   - `PORT` = `8080`
   - *(Optional)* If using external PostgreSQL:
     - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<host>:<port>/<db>`
     - `SPRING_DATASOURCE_USERNAME` = `<user>`
     - `SPRING_DATASOURCE_PASSWORD` = `<pass>`
     - `SPRING_DATASOURCE_DRIVER` = `org.postgresql.Driver`
5. **Deploy**: Click **Create Web Service**. Render will automatically build the Angular frontend, compile the Spring Boot JAR, and start your live instance at `https://your-app-name.onrender.com`.

---

### Option 2: Deploy on Koyeb (100% Free)

1. Go to [koyeb.com](https://www.koyeb.com) and log in with GitHub.
2. Click **Create Service** -> **GitHub**.
3. Select `Roster-Maker` repository.
4. Set builder to **Dockerfile** with port `8080`.
5. Choose the **Free Eco Instance** and click **Deploy**.

---

### Option 3: Deploy on Railway / Fly.io

1. **Railway**:
   - Go to [railway.app](https://railway.app).
   - Click **New Project** -> **Deploy from GitHub repo**.
   - Select `Roster-Maker` and Railway will automatically build and deploy via `Dockerfile`.

---

## 💻 Local Development Setup

### Prerequisites
- **Java 21** (`java -version`)
- **Maven 3.8+** (`mvn -version`)
- **Node.js 18+** & **NPM** (`node -v`, `npm -v`)

### 1. Start the Backend

```bash
cd smartroster-backend
mvn spring-boot:run
```
*The backend REST API will start at `http://localhost:8080`.*

### 2. Start the Frontend

```bash
cd smartroster-frontend
npm install
npm start
```
*The Angular web application will start at `http://localhost:4200`.*

### 3. Run with Docker Locally

```bash
# Build and run the single-container image
docker build -t smartroster .
docker run -p 8080:8080 smartroster
```
*Access the unified full-stack application at `http://localhost:8080`.*

---

## 👥 Default Demo Credentials

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| **System Admin** | `dc` | `dc123` | Full administrative control & department management |
| **System Admin** | `admin` | `admin123` | Secondary IT admin |
| **Shift Manager** | `manager` | `manager123` | Shift roster generator & team configuration |
| **Staff Member** | `rahul` | `user123` | View assigned shift calendar |
| **Staff Member** | `priya` | `user123` | View assigned shift calendar |

---

## 📄 License
Created by Dharmendra Chakrawarti (DC). Distributed under the MIT License.
