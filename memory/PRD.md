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
| GOOGLE_CLIENT_ID | (from Google Console) |
| GOOGLE_CLIENT_SECRET | (from Google Console) |
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
