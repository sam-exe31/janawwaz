# JANAVAAJ — Dashboard Specifications & Architecture Document (Dashboard.md)
*From Citizen Signals to Real-World Measurable Impact*

---

## 1. Visual System & Design Foundation

Janavaaj employs a **Warm Ivory SaaS** aesthetic designed for clarity, civic trust, and analytical rigor. The interface avoids dark modes, heavy saturated gradients, neon colors, crypto aesthetics, or archaic government-portal layouts.

### 1.1 Design Tokens

| Token | Value | Semantic Purpose |
|---|---|---|
| **App Background (`bg`)** | `#FAF9F6` (Alt: `#F8F7F3`) | Primary canvas; warm, organic ivory tone |
| **Card Surface (`surface`)** | `#FFFFFF` | Elevated card surfaces, tables, sidebars |
| **Borders (`border`)** | `#E8E6E0` | Subtle hairline dividers and component bounding boxes |
| **Primary Indigo (`primary`)** | `#3346B8` (Hover: `#4054C5`) | Primary action buttons, active navigation, key highlights |
| **Primary Soft (`primary-soft`)**| `#EEF2FF` | Active background tints, badge backgrounds |
| **Success (`success`)** | `#16A34A` (Soft: `#F0FDF4`) | Verified, Resolved, Citizen Verified, Completed |
| **Warning (`warning`)** | `#D97706` (Soft: `#FFFBEB`) | Pending, Under Review, Awaiting Verification |
| **Danger (`danger`)** | `#DC2626` (Soft: `#FEF2F2`) | Critical priority, Emerging Hotspots, Fake evidence rejected |
| **Info (`info`)** | `#2563EB` (Soft: `#EFF6FF`) | Active field execution, In Progress |
| **Partner (`partner`)** | `#9333EA` (Soft: `#FAF5FF`) | NGO & CSR impact portfolios, sponsorship allocations |
| **Violet (`violet`)** | `#7C3AED` (Soft: `#F5F3FF`) | AI intelligence chips, secondary demographic analytics |

### 1.2 Typography & Radius
- **Font Family**: Inter, system sans-serif fallback.
- **Scale**:
  - Dashboard Titles: 28–32px (font-black)
  - Section Headers: 18–22px (font-bold)
  - Card Titles: 14–16px (font-bold)
  - Primary Metric Figures: 28–36px (font-extrabold)
  - Supporting Captions / Disclaimers: 11–13px (font-medium text-slate-500)
- **Border Radius**: Cards `16px`, Inputs & Buttons `12px`, Badges `9999px` (pill).
- **Shadows**: Soft feathered elevation (`boxShadow.card`: `0 1px 3px rgba(0,0,0,0.05), 0 10px 25px -5px rgba(0,0,0,0.04)`).

---

## 2. Citizen Civic Dashboard (`/app/citizen`)

The Citizen experience is friendly, visual, and motivational. Dense municipal tables are minimized in favor of progressive disclosure, clear lifecycle progress bars, and before/after ground resolution proofs.

### 2.1 Section Breakdown (Ordered Specification)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Header (Time-based Greeting + Primary CTA + Map CTA)                │
├────────────────────────────────────────────────────────────────────────┤
│ 2. KPI Cards (6: Complaints, Verified, In Progress, Resolved, People, Impact) │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Quick Actions Strip (4: Voice, Text, Evidence Photo, Explore Map)   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Quick Services Strip (CivicSetu Category Chips: Pothole, Road, etc) │
├────────────────────────────────────────────────────────────────────────┤
│ 5. My Complaint Status (Active LifecycleProgress Steppers)             │
├────────────────────────────────────────────────────────────────────────┤
│ 6. Category Donut │ 7. Reporting Activity Line │ 8. Resolution Bars    │
├────────────────────────────────────────────────────────────────────────┤
│ 9. Civic Impact Around You (Interactive Light Map with Hotspots)       │
├────────────────────────────────────────────────────────────────────────┤
│ 10. My Top Impactful Reports Table (Ranked by People & Impact Score)   │
├────────────────────────────────────────────────────────────────────────┤
│ 11. Recent Activity Timeline │ 12. People Impacted Card │ 13. AI Insight│
├────────────────────────────────────────────────────────────────────────┤
│ 14. Before / After Ground Resolutions (Split Photographic Verification)│
├────────────────────────────────────────────────────────────────────────┤
│ 15. Closing Inspirational Civic Note                                   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Header**:
   - Greeting: Dynamic time-based: "Good morning / afternoon / evening, {name} 👋".
   - Subtitle: "Your voice can help create measurable, verified change in your community."
   - Primary CTA: `+ Raise a Civic Issue` (opens `/app/citizen/report`).
   - Secondary CTA: `View Impact Map` (opens `/app/map`).
2. **KPI Cards (6 Units)**:
   - *My Complaints*: Total filed count (e.g. 24) with trend badge (`↑ 14%`).
   - *Verified*: Complaints verified by AI & municipal geofencing (e.g. 21, 87.5% rate).
   - *In Progress*: Active field repair count (e.g. 5).
   - *Resolved*: Total successfully closed (e.g. 16, `↑ 18%`).
   - *People Impacted*: Aggregated population benefit (e.g. "3.8 Lakh").
   - *Impact Created*: Analytical civic rating dial (e.g. "92 / 100").
3. **Quick Actions (4 Units)**:
   - 🎙 *Report by Voice*: Launches 8-step multilingual voice capture.
   - 📝 *Report by Text*: Standard structured report form.
   - 📷 *Submit Evidence*: Geotagged camera & photo upload.
   - 🗺 *Explore Impact*: Neighborhood hotspot and project map.
4. **Quick Services Strip (CivicSetu Integration)**:
   - Compact category chips: `Pothole` · `Road Damage` · `Garbage` · `Streetlight` · `Water` · `Drainage` · `Footpath` · `Other`.
   - Clicking preselects category and launches complaint creation.
5. **My Complaint Status**:
   - Live complaint tracking cards showing `LifecycleProgress`:
     `1. Submitted → 2. AI Analyzed → 3. Evidence Verified → 4. Impact Calculated → 5. Prioritized → 6. Assigned → 7. Work Started → 8. Resolved`.
6. **"What Are You Reporting?"**:
   - Donut chart by category (Roads 46%, Water 21%, Streetlights 17%, Drainage 12%, Other 4%).
7. **"My Reporting Activity"**:
   - Monotone smooth line chart with range tabs: `7D | 30D | 6M | 1Y`.
8. **"Complaint Resolution"**:
   - Rounded bar chart grouping statuses: Submitted, Under Review, Verified, In Progress, Resolved.
9. **"Civic Impact Around You"**:
   - Interactive Light Map with circular semantic markers (Red, Amber, Blue, Green, Purple) and hotspot pulse effects.
10. **My Top Impactful Reports Table**:
    - Columns: Complaint ID & Title, Location, People Affected, Impact Score, Status, Action.
11. **Recent Activity**:
    - Vertical timeline of milestone events (e.g. "JNV-1042 · Main Road Rehabilitation · Milestone 2 completed · 2h ago").
12. **People Impacted Card**:
    - High-impact stat card displaying "3.8 Lakh" with `EstimateNote`: *"Estimated affected population associated with reported issues, not necessarily unique individuals."*
13. **AI Insight Card**:
    - Highlight card with automated hotspot alerts and direct action buttons ("Explore Hotspot").
14. **Before / After Ground Resolutions**:
    - Split-view toggleable before/after card displaying verified resolution proof, turnaround hours, project cost in INR, and partner attribution.
15. **Closing Civic Note**:
    - *“Your voice started the journey. Evidence made it visible. Impact made it actionable. Action created change.”*

---

## 3. NGO / CSR Social Impact Dashboard (`/app/ngo`)

Tailored for corporate social responsibility leaders, grantmakers, and non-profit executors. Focuses on capital deployment, audited milestone tracking, regulatory disclosures, and social return on investment.

### 3.1 Key Sections & Enterprise Features

1. **Header & Quick Controls**:
   - Title: "Welcome back, Impact Partner 👋"
   - Primary CTA: `Discover Projects to Support` (opens `/app/ngo/discover`).
   - Secondary CTA: `Generate CSR Report` (PDF export).
2. **6 Enterprise KPIs**:
   - *Projects Supported*: Total adopted projects (e.g. 24).
   - *People Benefited*: Verified beneficiaries (e.g. 2.4 Lakh, `↑ 24%`).
   - *Contribution*: Total documented funding (e.g. ₹2.8 Cr).
   - *Completed Projects*: 100% verified closures (e.g. 18).
   - *Active Projects*: Currently in ground execution (e.g. 6).
   - *Impact Score Generated*: Portfolio average (e.g. 94 / 100).
3. **Social Impact Return (per ₹1 Lakh Metric)**:
   - Benefited per ₹1L: 857 citizens.
   - Infrastructure units per ₹1L: 1.7 physical units renovated.
   - Issues resolved per ₹1L: 2.1 civic complaints closed.
   - Average completion turnaround: 4.2 days.
4. **Capital Allocation Charts**:
   - *Where Your Contribution Goes*: Donut chart (Roads 35%, Water 25%, Healthcare 15%, Waste 10%, Education 10%, Lighting 5%).
   - *Contribution Over Time*: Smooth area chart with toggle between **Amount committed (₹)** and **Projects count**.
   - *People Benefited by Category*: Rounded bar chart sorted by beneficiaries.
   - *Portfolio Status*: Donut breakdown (Completed 75%, Active In Progress 17%, Awaiting Milestone 8%).
5. **Funding Command & Tranche Tracker**:
   - Segmented progress bar showing:
     `Approved / Committed (₹2.8 Cr) → Released (₹2.15 Cr) → Utilized (₹2.0 Cr) → Pending Milestone (₹45 Lakh)`.
6. **Smart Milestone Tracker**:
   - **Crucial Rule**: *Payments are shown "Released" only when the backend verifies the milestone completion.*
   - Visual stepper: Done (Green ✓), Awaiting Verification (Amber ◷), Locked / Not Started (Gray ○).
   - Includes geotagged completion proof links and tranche allocation amounts.
7. **Regulatory & Tax Tracking Card (Audited Disclosures)**:
   - Documented Contribution: ₹2.8 Cr.
   - Eligible Benefit: ₹1.4 Cr (marked with *Illustrative / Demo Value* chip).
   - Documentation Percentage: 100% Verified.
   - Completion Certificates: 24 exportable dossiers.
   - **Mandatory Regulatory Disclosure Note**:
     > *"Tax treatment and applicable benefits depend on the organization's jurisdiction, eligibility, approved project structure and applicable regulations. Janavaaj tracks documented contributions and eligible benefits; it does not determine tax liability."*
8. **High-Impact Projects Awaiting Adoption**:
   - Direct integration with Discover flow (`/app/ngo/discover`) allowing one-click project adoption with terms agreement modal.

---

## 4. Policymaker / Civic Intelligence Command Center (`/app/policy`)

Designed for municipal commissioners, district magistrates, ward officers, and urban planners. Emphasizes geographic density, predictive hotspot detection, multi-factor verification, and outcome monitoring.

### 4.1 Dominant Hierarchy: Impact Over Volume
> **Core Principle**: In Janavaaj, **People Affected** and **Impact Score** dominate over raw complaint volume. A single blocked culvert affecting 120,000 citizens receives higher priority than 80 minor complaints from a single street.

### 4.2 Key Sections & Controls

1. **Header & Administrative Filters**:
   - Title: "Civic Intelligence Command Center"
   - Geography Switcher: Pune District (Municipal & ZP) → Maharashtra State → India National.
   - Date Range: Last 7 Days, Last 30 Days, Quarterly (90D).
   - Primary CTA: `Export Report (PDF)`.
2. **8 Command KPIs (with "Demo Data" Badges)**:
   - Total Complaints: 24,680
   - Verified Complaints: 21,420
   - Pending Review: 1,840
   - High-Impact Issues: 38
   - People Affected: 3.8 Lakh
   - Active Projects: 42
   - Resolved Complaints: 18,920
   - Funding Committed: ₹4.8 Cr
3. **Emerging Hotspot Alerts**:
   - Real-time alert card: "+240% Surge in Hadapsar Arterial Road Damage (Zone 4) over 7 days, affecting 1.8 Lakh citizens". Direct button to zoom and investigate on the map.
4. **Highest-Impact Civic Issues Table**:
   - Columns: Issue Name, Location, Complaint Count, **People Affected (Bold/Large)**, Severity Pill, Infrastructure Importance, Evidence Confidence %, **Impact Score (Highlighted)**, Action.
5. **Impact vs Complaints Scatter Plot**:
   - Quadrant analysis plotting Complaints (X-axis) vs People Affected (Y-axis), with circle size scaled by Impact Score.
   - Specifically highlights **"Low Complaints — High Impact" Outliers** (e.g., critical water trunk bursts with only 28 complaints but 95,000 people impacted).
6. **Civic Domain & Location Analytics**:
   - Donut chart of issues by municipal category.
   - Horizontal bar chart of population impact sorted by administrative zones (Zone 4 Hadapsar, Zone 2 Baner, Zone 3 Sinhagad, Zone 1 Kothrud).
   - Multi-line daily trend chart: Complaints filed vs verified vs resolved.
7. **Civic Verification Center Queue**:
   - Evidentiary audit table displaying: GPS validation (✓), Image AI genuineness audit (✓), GIS municipal ward boundary check (✓), Duplicate check (✓), and confidence %.
   - Actions: `Approve` or `Inspect Evidence` (modal for image review, notes, or rejection).
8. **Funding Command Center & Milestone Releases**:
   - Tranche approval controls: Authorizes payment tranche release upon reviewing field completion evidence.
9. **Civic Action Network & Partner Performance Table**:
   - Strict adherence to objective SLA metrics: Active Projects, Completed Works, Average Turnaround (hours), People Benefited, Audit Compliance %.
   - **No medals, rankings, or gamified trophies**.
10. **Resolution Funnel ("From Signal to Resolution")**:
    - Horizontal funnel stages:
      `1. Reports Received (24,680) → 2. AI Screened (21,420) → 3. High Impact Filtered (1,840) → 4. Prioritized (420) → 5. Partner Assigned (180) → 6. Work Completed (142) → 7. Citizen Verified (136)`.
11. **Real-World Outcomes Summary**:
    - Issues Resolved (18,920), People Benefited (240,000), Infrastructure Improved (340 Units), Avg SLA (32 Hours), Funding Utilized (₹3.2 Cr), Cost per Beneficiary (₹133).
12. **AI Executive Summary**:
    - Natural language briefing generated by Janavaaj AI summarizing municipal performance, emerging risks, and public satisfaction gains.

---

## 5. CivicSetu Redesign inside Janavaaj

CivicSetu is **not a standalone product**; its voice, AI classification, and quick service capabilities live directly inside Janavaaj's unified app shell.

### 5.1 Docked Right AI Panel (`AiDock.tsx`)
- **Desktop (≥ 1280px)**: Docked 380px panel on the right side of the screen. Pushes content smoothly without covering it.
- **Mobile & Tablet**: Overlay drawer with a floating `✦ Ask Janavaaj AI` pill in the bottom right corner.
- **Multilingual Switcher**: Dedicated chips for **EN | हिंदी | मराठी** in the header.

### 5.2 8-Stage Voice Complaint State Machine

```
[idle] ──▶ [requesting-permission] ──▶ [listening] (pulsing mic)
                                            │
                                            ▼
[detected] ◀── [analyzing] ◀── [transcript-ready] ◀── [transcribing]
    │
    ▼ (Explicit citizen click)
[Review Complaint Screen] ──▶ [Confirm & Issue ID: JNV-xxxx]
```

- **States**:
  1. `idle`: Circular microphone, "Tap to speak", language toggles.
  2. `requesting-permission`: Browser mic permission prompt.
  3. `listening`: Red pulsing mic, live interim transcript display, "Done Speaking" button.
  4. `transcribing`: Processing spinner (for backend STT fallback).
  5. `transcript-ready`: Editable transcript textarea.
  6. `analyzing`: AI skeleton classifier identifying department and priority.
  7. `detected`: Structured card showing Detected Issue, Location, Priority, and Department.
  8. `review`: Final review screen.
- **Absolute Rule**: *No complaint is ever auto-submitted.* The user must explicitly inspect and confirm the detected issue on the Review screen.

### 5.3 Computer Vision Photo Analysis
- Uploading or capturing an image prompts automated AI analysis:
  `"Image analysis suggests this is a road pothole with 94% confidence. Severity: HIGH. Estimated repair: ₹4,500–₹8,000."`
- Provides a one-click button: *"Proceed to Report with this Photo"*.

---

## 6. End-to-End API Route Alignment

| Route / Method | Purpose | Role Access |
|---|---|---|
| `POST /api/v1/ai/chat` | Multi-turn conversational civic assistant | All |
| `POST /api/v1/complaints/analyze` | AI classification, priority, department, duplicates | Citizen |
| `POST /api/v1/ai/image-analyze` | Computer vision diagnosis of civic damage photos | All |
| `POST /api/v1/speech/transcribe` | Audio file transcription (en-IN, hi-IN, mr-IN) | Citizen |
| `GET /api/v1/dashboard/citizen/*` | Summary, categories, activity trend, outcomes | Citizen |
| `GET /api/v1/dashboard/ngo/*` | Summary, contribution trend, tax tracking, ROI | NGO / CSR |
| `GET /api/v1/dashboard/policy/*` | Summary, priority issues, scatter, funnel, outcomes | Policymaker |
| `GET /api/v1/map/issues` | GeoJSON features with semantic severity markers | All |
| `GET /api/v1/verification/queue` | Evidentiary audit queue | Policymaker |
| `POST /api/v1/verification/:id/decision` | Approve, reject, or flag duplicate | Policymaker |
| `GET /api/v1/milestones` | Milestone progress and tranche verification | All |
| `POST /api/v1/milestones/:id/approve` | Authorize milestone payment release | Policymaker |
| `POST /api/v1/reports` | Compile executive briefing or CSR impact PDF | NGO, Policy |

---

## 7. Verification & Production Readiness
- **Backend Build**: Clean TypeScript compilation (`tsc`) in root.
- **Frontend Build**: Clean Vite + React 19 + TypeScript + Tailwind bundle (`npm run build` in `janavaaj-web`).
- **Demo Switcher**: Live role switcher available in sidebar and topbar profile menu (`Citizen ↔ NGO/CSR ↔ Policymaker`) for seamless demonstration without manual re-login.
