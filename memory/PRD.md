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

## Project Detail Tabs
1. **Overview** - Project details + Weekly Updates (week-over-week tracking)
2. **Milestones** - Key project milestones with health status
3. **Stories** - User stories with sprint assignments
4. **RAID Log** - Risks, Issues, Action Items, Decisions (table format)
5. **Changes** - Change requests with approval workflow

## RAID Log (Risks, Issues, Action Items, Decisions)

### Type Definitions
- **R - Risks**: Potential future problems that may impact the project
- **I - Issues**: Current problems that are actively being resolved
- **A - Action Items**: Tasks that need to be completed by specific owners
- **D - Decisions**: Key decisions made by the team that affect the project

### Table Columns
| Type | Title | Owner | Priority | Due Date | Status | Actions |

### Priority Levels
- Low, Medium, High, Critical

### Status Options
- Open, Closed (clickable toggle)

## Seed Data Per Project
- 6 Production release milestones
- 10 Stories
- 14 RAID items (3 Risks, 3 Issues, 4 Action Items, 4 Decisions)
- 3 Weekly updates
- 2 Change requests

## API Endpoints
- `/api/raid-items` - CRUD for RAID items (type: risk, issue, action_item, decision)
- `/api/weekly-updates` - Weekly Updates CRUD
- `/api/change-requests` - Change Management CRUD
- `/api/seed-demo-data` - Seeds all demo data

## Frontend Routes
- `/` - Landing
- `/dashboard` - Dashboard
- `/projects` - All Projects
- `/project/:id` - Project Detail (5 tabs: Overview, Milestones, Stories, RAID Log, Changes)
- `/sprint` - Sprint Board
- `/resources` - Team
- `/program` - Program View
- `/changes` - Change Management Dashboard
- `/copilot` - AI Copilot
- `/create` - AI Project Creator
