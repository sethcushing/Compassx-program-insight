# CompassX - AI Project Intelligence Platform

## Deployment Ready

### Files Created for Koyeb Deployment
- `Dockerfile` - Multi-stage build (Node + Python)
- `.dockerignore` - Excludes unnecessary files
- `DEPLOYMENT.md` - Complete deployment guide

### MongoDB Production
```
Connection: mongodb+srv://sethcushing:compassx@compassxprograminsight.htuibk0.mongodb.net/?appName=CompassXProgramInsight
Database: compassx_prod
```

### Koyeb Environment Variables
| Variable | Value |
|----------|-------|
| MONGO_URL | mongodb+srv://sethcushing:compassx@compassxprograminsight.htuibk0.mongodb.net/?appName=CompassXProgramInsight |
| DB_NAME | compassx_prod |
| APP_URL | https://your-app.koyeb.app |

### Architecture
```
Koyeb Container (Port 8000)
├── Nginx (static files + reverse proxy)
│   ├── / → React frontend
│   └── /api/* → FastAPI backend
└── FastAPI (Port 8001)
    └── MongoDB Atlas
```

---

## Team & Projects

### Team Members
- Paddy, Seth, Brian, Ashley, Fifi, Charlene, Sandeep

### Projects
- BOM Grid v1.0 (Fifi)
- Digital Intake Co-Pilot (Ashley)
- CPQ Reimagined (Seth)
- Code Red Tracker (Seth)
- Change Management Transformation (Charlene)

## Features Implemented
- Project Management with Milestones, Stories
- RAID Log (Risks, Issues, Action Items, Decisions)
- Weekly Updates tracking
- Change Management with approval workflow
- Sprint Board (Kanban) with All Projects view
- Dashboard Quick Access (Milestones, Risks, Issues, Decisions, Action Items)
- AI Copilot (configured, not yet active)

## What's Been Implemented

### Session 1 (Previous)
- Core CRUD: Projects, Stories, Sprints, Milestones, Tasks, Risks
- Weekly Updates, RAID Log, Change Management features
- Custom seed data for projects and people
- Authentication fully removed (app is public)
- Dockerfile & deployment docs for Koyeb
- UI branding updates

### Session 2 (Current - Feb 2026)
- **Docker Build Fix**: Dockerfile now uses `yarn install` directly (no frozen-lockfile, no npm fallback) to handle React 19 peer dep conflicts with react-day-picker
- **Dashboard Quick Access**: New section with tabbed view of Milestones (30), Risks (15), Issues (15), Decisions (20), Action Items (20) across all projects. Clickable rows navigate to project detail.
- **Sprint Board All Projects**: Defaults to showing stories from all projects with project names on cards. Dropdown filter for specific project.
- **Project Detail Overview Cleanup**: Removed Project Phases section. Latest weekly update highlighted with "Latest" badge. Previous updates in scrollable container.

### New Backend Endpoints Added
- `GET /api/dashboard/quick-access` - Cross-project milestones + RAID items
- `GET /api/stories/all` - Stories from all projects with project_name

## Prioritized Backlog
### P1
- Refactor `server.py` into separate route files
- Break up `ProjectDetail.jsx` into smaller components
- Comprehensive E2E test execution

### P2
- AI Project Creator (generate project plans from prompt)
- AI Copilot enhancements
- Resource Manager page

### P3
- AI-powered predictive features
- GitHub/Jira integrations
- Automated reporting center
