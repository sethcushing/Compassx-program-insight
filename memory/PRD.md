# CompassX - AI Project Intelligence Platform

## Product Overview
AI-native project management platform with glassmorphism UI. No authentication required (public app).

### Team Members
Paddy, Seth, Brian, Ashley, Fifi, Charlene, Sandeep

### Projects
BOM Grid v1.0, Digital Intake Co-Pilot, CPQ Reimagined, Code Red Tracker, Change Management Transformation

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI (port 3000)
- **Backend**: FastAPI + MongoDB via Motor (port 8001)
- **Deployment**: Docker + Nginx → Koyeb

## Features Implemented
- Project CRUD with milestones, stories, sprints
- RAID Log (Risks, Issues, Action Items, Decisions)
- Weekly Updates with latest-highlighted + rolling scroll
- Change Management dashboard with approve/reject workflow
- Sprint Board with "All Projects" view + project filter
- Dashboard Quick Access (cross-project Milestones, RAID items)
- **4-Blocker Reports** — editable quadrants (Accomplished / Roadblocks / Upcoming / Needs-Asks) with PDF export and version history
- Sidebar: Dashboard, All Projects, Sprint Board, Resources, Program View, Change Mgmt, AI Creator, AI Copilot

## Key API Endpoints
- `/api/projects`, `/api/stories`, `/api/sprints`
- `/api/projects/{id}/weekly-updates`
- `/api/projects/{id}/raid-items`
- `/api/projects/{id}/change-requests`
- `/api/projects/{id}/four-blocker` (GET/POST)
- `/api/projects/{id}/four-blocker/history` (GET)
- `/api/projects/{id}/four-blocker/export` (GET → PDF)
- `/api/dashboard/quick-access`
- `/api/stories/all`
- `/api/change-management/dashboard`

## Deployment Status
- Dockerfile uses `yarn install` (handles React 19 peer dep conflicts)
- Pending: User needs to Save to GitHub and trigger Koyeb build

## Prioritized Backlog
### P1
- Refactor server.py into routers
- Refactor ProjectDetail.jsx into smaller components
- E2E test suite

### P2
- AI Project Creator, AI Copilot enhancements
- Resource Manager page

### P3
- AI predictive features, GitHub/Jira integrations
- Automated reporting center
