# CompassX - AI Project Intelligence Platform

## Team Members
- **Paddy** - Program Director
- **Seth** - Technical Lead
- **Brian** - Senior Developer
- **Ashley** - Product Manager
- **Fifi** - Business Analyst
- **Charlene** - Change Manager
- **Sandeep** - QA Lead

## Projects
| Project | Owner | Target Date | Priority |
|---------|-------|-------------|----------|
| BOM Grid v1.0 | Fifi | 2025-03-31 | High |
| Digital Intake Co-Pilot | Ashley | 2025-04-15 | High |
| CPQ Reimagined | Seth | 2025-02-28 | Critical |
| Code Red Tracker | Seth | 2025-03-15 | High |
| Change Management Transformation | Charlene | 2025-04-30 | High |

## RAID Log (Risks, Issues, Action Items, Decisions)

### Type Definitions
- **R - Risks**: Potential future problems that may impact the project
- **A - Action Items**: Tasks that need to be completed by specific owners
- **I - Issues**: Current problems that are actively being resolved
- **D - Decisions**: Key decisions made by the team that affect the project

### Display Format
RAID items are displayed in a table format with columns:
| Type | Title | Owner | Priority | Due Date | Status | Actions |

### Priority Levels
- Low, Medium, High, Critical

### Status Options
- Open, Closed

## Features Implemented

### Core Features
- Google OAuth login
- Dashboard with project stats
- AI Project Creator
- Sprint Planner with Kanban board
- Resource Manager
- All Projects page
- Program View
- Change Management Dashboard
- Light/Dark mode

### Project Detail Tabs
- Overview (with Weekly Updates)
- Action Items (renamed from Tasks)
- Milestones
- Stories
- RAID Log (table format)
- Changes
- Risks

## Seed Data Per Project
- 6 Production release milestones
- 10 Stories
- 8 Action Items
- 4 Risks with mitigations
- 14 RAID items (3 Risks, 3 Issues, 4 Action Items, 4 Decisions)
- 3 Weekly updates
- 2 Change requests

## API Endpoints
- `/api/raid-items` - CRUD for RAID items (type: risk, issue, action_item, decision)
- `/api/weekly-updates` - Weekly Updates CRUD
- `/api/change-requests` - Change Management CRUD
- `/api/seed-demo-data` - Seeds all demo data
