# ForgeTrack v1.0.0 - Cyber Ops Interface
### Enterprise Attendance & Material Resource Planning (MRP) for The Forge

**ForgeTrack** is a production-ready, decoupled full-stack ecosystem designed to modernize academic operations for **The Forge AI-ML Engineering Bootcamp**. By integrating **Generative AI** for legacy data ingestion, implementing strict **Role-Based Access Control (RBAC)**, and delivering a cyberpunk-inspired UI with full functional completeness, ForgeTrack transforms fragmented spreadsheets into a scalable, high-integrity data asset.

🚀 **Live Environment:** [forge-track-eight.vercel.app](https://forge-track-eight.vercel.app) | 📊 **GitHub:** [Nishchal-Bhandari/ForgeTrack](https://github.com/Nishchal-Bhandari/ForgeTrack) | ✅ **Status:** Production Ready

---

## 🏗️ System Architecture

ForgeTrack follows a modern **Decoupled Architecture** to ensure independent scalability of the presentation and logic layers.

*   **Presentation Layer:** A high-performance SPA built with React 18, leveraging **Atomic Design** principles for UI components.
*   **Application Layer:** A RESTful Node.js API utilizing **Express 5.x** for high-throughput request handling.
*   **Intelligence Layer:** Integrated **Google Gemini 2.0 Flash** agent for heuristic analysis and unpivoting of heterogeneous CSV datasets.
*   **Data Layer:** Distributed **MongoDB Atlas** cluster for schema-flexible yet strictly modeled document storage via Mongoose.

---

## 🛡️ Security & Governance

Enterprise-grade security is baked into the core of the platform:

*   **Authentication:** Stateless **JWT (JSON Web Tokens)** implementation with BcryptJS password hashing (cost factor: 10).
*   **Authorization:** Multi-tier RBAC (Role-Based Access Control) enforced at both the API gateway and the database query level.
*   **Data Integrity:** Transactional batch processing for AI-assisted imports to prevent partial data corruption (Atomic Operations).
*   **Environment Management:** Strict separation of secrets via environment-specific `.env` injection.

---

## 📁 Project Structure

```text
ForgeTrack/
├── backend/                # Logic Layer (Node.js/Express)
│   ├── src/
│   │   ├── middleware/     # Auth & Validation logic
│   │   ├── models/         # Mongoose Schemas (OOD)
│   │   ├── routes/         # REST Endpoints
│   │   └── server.js       # Entry point
│   └── seed.sql            # DB schema & constraints (no seed data)
├── frontend/               # Presentation Layer (React/Vite)
│   ├── src/
│   │   ├── components/     # UI/UX Library (Atomic components)
│   │   ├── context/        # Global State Management
│   │   └── pages/          # View Controllers
│   └── tailwind.config.js  # Design System tokens
└── docs/                   # System Documentation & Specs
```

---

## ⚡ Quick Start (Developer Onboarding)

### 1. Prerequisite Audit
Ensure the following are installed: `Node.js v18.x`, `npm v9.x`, and a `MongoDB 6.0+` instance.

### 2. Environment Configuration
Create `.env` files in both `/backend` and `/frontend` based on the provided templates.

```bash
# Backend Audit
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/forgetrack
JWT_SECRET=your_32_char_secret_key
GEMINI_API_KEY=your_google_ai_key

# Frontend Audit
VITE_API_URL=https://api.yourdomain.com/api
```

### 3. Execution
```bash
# Install & Bootstrap
npm install && npm run dev:all
```

### 👤 Demo Credentials for Evaluation

**Live Application:** https://forge-track-eight.vercel.app

For evaluation and testing, use these pre-configured demo accounts:

#### Mentor Account
- **Email:** `mentor@forge.local`
- **Password:** `password123`
- **Role:** Mentor (Full access to dashboards, student management, attendance, materials)

#### Student Account
- **Email:** `student@forge.local`
- **Password:** `password123`
- **Role:** Student (Access to personal attendance, materials, messaging)

**Note:** These accounts are pre-seeded in the database and available immediately upon login.

---

## 🎨 Design System: Cyber Ops v1.0

**Latest Transformation:** ForgeTrack has been redesigned with a cyberpunk-inspired interface featuring:

- **Color Palette:** Neon green (#00FF41) accents on dark surfaces (#0A0A0A, #1A1A1A) for high contrast
- **Animations:** GSAP-powered smooth transitions with 0.3-1.2s durations for entrance, hover, and interactive effects
- **Typography:** Monospace font stack for terminal feel, maintaining accessibility
- **Components:** Custom cyber UI library (CyberCard, CyberMetric, CyberTable, CyberTerminal, StatusBadge, etc.)
- **Effects:** Three.js particle system with mouse-tracking particles on dashboard backgrounds
- **Responsive Design:** Full mobile support while maintaining cyberpunk aesthetic

### Core Features Implemented
- ✅ **Dashboard Analytics:** Real-time metrics, student count, attendance trends, session history
- ✅ **Attendance Management:** Create sessions, mark attendance, track trends, export CSV
- ✅ **Student Management:** Full CRUD operations with validation
- ✅ **Material Distribution:** Upload, categorize, and distribute educational resources
- ✅ **AI-Powered Import:** Upload Excel/CSV with AI-assisted column mapping and date inference
- ✅ **Import Preview:** Dry-run with conflict detection before committing to database
- ✅ **Messaging System:** Real-time communication between mentors and students
- ✅ **Role-Based Access:** Mentor and Student dashboards with appropriate feature gating
- ✅ **Settings Panel:** Dark mode, profile management, password change
- ✅ **Notifications:** System alerts and messaging notifications

### Account Access
ForgeTrack supports real user onboarding.
Create mentor and student accounts from the mentor workflow or your admin tooling, then sign in with those issued credentials.

---

## 🛠️ Build & Release Pipeline

| Phase | Designation | Status | Objective |
| :--- | :--- | :--- | :--- |
| **P0** | **Foundation** | ✅ Complete | Design Tokenization, Vite Scaffold, Atomic UI Baseline |
| **P1** | **Persistence** | ✅ Complete | Mongoose Modeling, Data Integrity Logic, RLS Policies |
| **P2** | **App Shell** | ✅ Complete | Dynamic Routing, Navigation State, Role-Aware Controllers |
| **P3** | **Mentor Core** | ✅ Complete | Dashboard Analytics, Real-time Attendance, Material MRP |
| **P4** | **AI Agent** | ✅ Complete | **Gemini heuristic mapping** for pivoted CSV ingestion with dry-run preview |
| **P5** | **Student Portal**| ✅ Complete | Self-scoped telemetry, resource accessibility, messaging, attendance tracking |
| **P6** | **Production QA** | ✅ Complete | E2E browser testing, functionality verification, console logging audit, deployment verification |

---

## 🧪 Quality Assurance & Testing

**✅ All features have been tested and verified to be fully functional:**

### Frontend Verification
- ✅ **All UI Components:** Interactive, responsive, and styled with cyber aesthetic
- ✅ **Navigation:** All routes functional, role-based access enforced
- ✅ **Mentor Dashboard:** Analytics display, data loading, real-time updates
- ✅ **Attendance Features:** Session creation, attendance marking, CSV export
- ✅ **Student Management:** Add/edit/delete operations, form validation
- ✅ **AI Bulk Import:** File upload, sheet detection, mapping, dry-run preview, conflict resolution, batch commitment
- ✅ **Student Portal:** Personal attendance view, materials access, messaging, upcoming sessions
- ✅ **Settings & Auth:** Profile management, theme switching, password change, logout

### Backend Verification
- ✅ **API Health:** All endpoints responding correctly
- ✅ **Database Connection:** MongoDB Atlas live and operational
- ✅ **Authentication:** JWT token generation and validation working
- ✅ **AI Integration:** Gemini API successfully analyzing sheets and inferring dates
- ✅ **Batch Processing:** Import batches tracked, rollback functional

### Production Build
- ✅ **Vite Build:** Successful compilation to minified bundles
- ✅ **Console Logging:** Gated to development environment only (no noise in production)
- ✅ **Three.js Warnings:** All resolved (PointsMaterial sizeRange property removed)
- ✅ **Bundle Size:** ~500KB (non-blocking, acceptable for feature set)
- ✅ **Vercel Deployment:** Live and serving requests
- ✅ **CORS & Headers:** Properly configured for cross-origin requests

### Functional Coverage
- Unit Testing: Core utilities and parsers
- Integration Testing: API endpoints validated via live requests
- UI Testing: Component interactivity verified in browser
- User Acceptance (UAT): All features match ForgeTrack Spec Sheet

---

## 🤝 Contribution Guidelines

We maintain high standards for code quality:
1. **ESLint/Prettier**: All code must pass the linting audit before PR.
2. **Commit Strategy**: Use **Conventional Commits** (e.g., `feat:`, `fix:`, `docs:`).
3. **Documentation**: Any change to API surface must be updated in `docs/`.

---

## � Documentation

- **ForgeTrack_Detailed_Report.pdf:** Comprehensive submission document with project overview, architecture, features, and QA results
- **ForgeTrack Spec Sheet.md:** Original system requirements and design specification
- **SKILL_build_forgetrack.md:** Development workflow and build instructions

---

## �📜 Legal & Licensing
Developed by **Nishchal Bhandari** for **The Forge Bootcamp**. All rights reserved. Proprietary software for academic administrative optimization.
