# Janawwaz (जनआवाज) - Civic Issue Resolution Platform

> AI-Powered Civic Grievance Intake, Automated Screening, NGO Assignment & Municipal Resolution Platform. Built for Pune Metropolitan Region.

---

## 🏛️ Platform Architecture & Overview

Janawwaz connects **Citizens**, **Verified NGOs**, and **Municipal Administrators** into a unified, high-accountability civic repair engine.

1. **Multimodal Intake**: Citizens report civic complaints via Web (Photos + GPS Coordinates) or telephone IVR.
2. **AI Screening Pipeline**: Powered by Google Gemini. Validates image genuineness, runs prompt injection defense, extracts categories, and infers priorities.
3. **Automated Clustering**: Groups duplicate reports within 100 meters using MySQL spatial indexing (`ST_Distance_Sphere`).
4. **NGO Claim Engine**: NGOs claim issues within their service radius. High-concurrency row-level locks prevent race conditions, bounded by daily claim limits (5/day) and active limits (5 concurrent).
5. **State Machine Integrity**: Every state change is governed by an ACID state machine service with full history audit trails.
6. **Citizen Rating & NGO Ranking**: section 16 rank formula based on resolution speed, verified completions, citizen ratings, and abandonment penalties.
7. **Append-Only Reward Ledger**: Citizens earn reward points for legitimate reports and feedback.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ or v20+
- **MySQL**: 8.0+ or 9.3+ running locally on port `3306`

### 1. Configure Environment
```bash
cp .env.example .env
```
Default MySQL configuration:
```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mysql
DB_NAME=janawwaz_db
```

### 2. Run Database Migrations & Seeds
```bash
# Run Flyway-style SQL migrations & seed Pune data
npm run migrate
```
This sets up all 23 database tables, spatial indexes, 10 categories, 3 Pune NGOs, 9 field helpers, and admin credentials.

### 3. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser to access the live web application!
- **Landing Page & Web App**: [http://localhost:3000/](http://localhost:3000/)
- **Swagger REST API Docs**: [http://localhost:3000/swagger-ui.html](http://localhost:3000/swagger-ui.html)
- **Health Check**: [http://localhost:3000/actuator/health](http://localhost:3000/actuator/health)

### 4. Run Test Suite
```bash
npm test
```
Runs all 6 test suites with 66 comprehensive integration and unit tests covering every phase.

---

## 🔒 Authentication & Role Separation

### Citizen Registration & Login (OTP Only)
Citizens are the **ONLY role allowed to self-register** on the platform.
- **Request OTP**: `POST /api/v1/auth/otp/request` with Indian phone number (`+919000000001` to `+919000000010` in demo whitelist).
- **Verify OTP**: `POST /api/v1/auth/otp/verify` with code `123456`.
- Creates or retrieves `CITIZEN` record, issues 15-minute Access JWT and 7-day Refresh Token.

### Why NGOs and Admins Cannot Self-Register
To prevent fraudulent organizations or bad actors from claiming public repair funds:
- **NGOs** can ONLY be created by an authenticated Municipal Super-Admin via `POST /api/v1/admin/ngos`. The system auto-provisions a secure temporary password.
- **Admins** cannot be registered via public endpoints; they are seeded or created via private operational tooling.

---

## 👥 Seeded Credentials for Testing

| Role | Name / Organization | Email / Phone | Password / OTP |
|---|---|---|---|
| **Citizen 1** | Rohan Sharma | `+919000000001` | OTP: `123456` |
| **Citizen 2** | Priya Deshmukh | `+919000000002` | OTP: `123456` |
| **NGO 1 (Kothrud)** | Pune Seva Foundation | `kothrud.ngo@civic.gov.in` | `Ngo@123456` |
| **NGO 2 (Hadapsar)** | Jan Kalyan Samiti | `hadapsar.ngo@civic.gov.in` | `Ngo@123456` |
| **NGO 3 (Pimpri)** | Civic Action Trust | `pimpri.ngo@civic.gov.in` | `Ngo@123456` |
| **Super Admin** | Municipal Commissioner Office | `admin@civic.gov.in` | `Admin@123456` |

---

## 🔄 End-to-End Workflow Verification

```
[ Citizen ] ──(OTP Sign Up)──► [ Report Grievance with Photo & GPS ]
                                         │
                                         ▼
                            [ Gemini AI Screening Pipeline ]
                              ├─ Genuineness Score (>0.75)
                              ├─ Category & Budget Extraction
                              └─ 100m Clustering Check
                                         │
                                         ▼
                                   Status: OPEN
                                         │
       ┌─────────────────────────────────┴─────────────────────────────────┐
       ▼                                                                   ▼
[ NGO Portal ]                                                    [ Volunteer Feed ]
  ├─ Claim Issue (Row Lock)                                         ├─ View Easy/Low Budget
  ├─ Assign Field Helper                                            ├─ Masked Citizen Phone
  ├─ Start Work (IN_PROGRESS)                                       └─ Log Community Coordination
  └─ Upload BEFORE + AFTER Photos
       │
       ▼
Status: COMPLETED
       │
       ▼
[ Municipal Admin ] ──► Final Inspection & Status Override ──► Status: CLOSED
       │
       ▼
[ Citizen Feedback ] ──► 1-5 Star Rating & Review ──► Recalculate NGO Rank Score
```

---

## 🐳 Docker Deployment
```bash
docker-compose up --build -d
```
Starts MySQL 9.3 and the Janawwaz API container in production configuration.
