# CompassX - AI Project Intelligence Platform

## Deployment Ready

### Files Created for Koyeb Deployment
- `Dockerfile` - Multi-stage build (Node + Python)
- `.dockerignore` - Excludes unnecessary files
- `DEPLOYMENT.md` - Complete deployment guide
- `.env.production.example` - Environment variable template

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

## Features
- Project Management with Milestones, Stories
- RAID Log (Risks, Issues, Action Items, Decisions)
- Weekly Updates tracking
- Change Management with approval workflow
- Sprint Board (Kanban)
- AI Copilot

## What's Been Implemented
- Weekly Updates, RAID Log, Change Management features
- Custom seed data for projects and people
- Authentication fully removed (app is public)
- Dockerfile & deployment docs for Koyeb
- UI branding updates (removed Emergent badge, updated page title)
- Refined Project Detail page UI with consolidated tabs

## Docker Build Fix (Feb 2026)
- Fixed Dockerfile to explicitly use `yarn install --frozen-lockfile` and `yarn build`
- Root cause: `react-day-picker@8.10.1` has peer dep `react: ^16-18` which conflicts with React 19. Yarn handles this gracefully; npm fails.
- Removed conditional npm fallback logic — yarn.lock is the source of truth

## Prioritized Backlog
### P1
- Refactor `server.py` into separate route files
- Break up `ProjectDetail.jsx` into smaller components
- Comprehensive E2E testing

### P2
- AI Project Creator (generate project plans from prompt)
- AI Copilot enhancements
- Resource Manager page

### P3
- AI-powered predictive features
- GitHub/Jira integrations
- Automated reporting center
