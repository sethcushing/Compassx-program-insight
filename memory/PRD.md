# CompassX - AI Project Intelligence Platform

## Original Problem Statement
Build a highly graphical, modern, AI-native project management platform designed to automate planning, tracking, reporting, and decision-making across projects and portfolios.

## Team Members
- **Paddy** - Program Director (Strategy, Leadership, Stakeholder Management)
- **Seth** - Technical Lead (Architecture, Python, Cloud, Integration)
- **Brian** - Senior Developer (React, TypeScript, API Design)
- **Ashley** - Product Manager (Agile, Requirements, User Research, AI/ML)
- **Fifi** - Business Analyst (Data Analysis, Process Design, Requirements)
- **Charlene** - Change Manager (Change Management, Training, Communications)
- **Sandeep** - QA Lead (Test Automation, Performance Testing, Security Testing)

## Projects
| Project | Owner | Target Date | Priority |
|---------|-------|-------------|----------|
| BOM Grid v1.0 | Fifi | 2025-03-31 | High |
| Digital Intake Co-Pilot | Ashley | 2025-04-15 | High |
| CPQ Reimagined | Seth | 2025-02-28 | Critical |
| Code Red Tracker | Seth | 2025-03-15 | High |
| Change Management Transformation | Charlene | 2025-04-30 | High |

## What's Been Implemented

### Core Features (COMPLETE)
- [x] Google OAuth login
- [x] Dashboard with project stats and story points charts
- [x] AI Project Creator
- [x] Project Detail with tabs (Overview, Action Items, Milestones, Stories, RAID Log, Changes, Risks)
- [x] Sprint Planner with Kanban board
- [x] Resource Manager
- [x] All Projects page
- [x] Program View
- [x] Change Management Dashboard
- [x] Weekly Updates tracking (what's going well + roadblocks)
- [x] RAID Log (Roles, Assumptions, Issues, Dependencies)
- [x] Light/Dark mode

### Seed Data Includes
For each project:
- Production release milestones
- Sprint structure for production prep
- Stories for release activities
- Action items with assignees
- Risks with mitigations
- RAID items (roles, assumptions, issues, dependencies)
- Weekly updates (3 weeks of history)
- Change requests for production release

## API Endpoints
- `/api/projects/*` - Project CRUD
- `/api/tasks/*` - Action Items CRUD
- `/api/stories/*` - Stories CRUD
- `/api/sprints/*` - Sprints CRUD
- `/api/milestones/*` - Milestones CRUD
- `/api/risks/*` - Risks CRUD
- `/api/resources/*` - Resources CRUD
- `/api/weekly-updates/*` - Weekly Updates CRUD
- `/api/raid-items/*` - RAID Log CRUD
- `/api/change-requests/*` - Change Requests CRUD
- `/api/change-management/dashboard` - Change Management Stats
- `/api/seed-demo-data` - Seeds all custom data

## Frontend Routes
- `/` - Landing
- `/dashboard` - Dashboard
- `/projects` - All Projects
- `/project/:id` - Project Detail
- `/sprint` - Sprint Board
- `/resources` - Team
- `/program` - Program View
- `/changes` - Change Management Dashboard
- `/copilot` - AI Copilot
- `/create` - AI Project Creator

## Next Tasks
1. AI-generated status reports
2. Dependency graph visualization
3. GitHub/Jira integrations
