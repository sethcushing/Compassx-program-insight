# CompassX - AI Project Intelligence Platform

## Original Problem Statement
Build a highly graphical, modern, AI-native project management platform designed to automate planning, tracking, reporting, and decision-making across projects and portfolios. This platform should function as an AI Project Intelligence System that helps organizations plan, manage, and optimize projects with minimal manual overhead.

## User Choices
- **AI Provider**: OpenAI GPT-5.2 (via Emergent LLM Key)
- **Authentication**: Emergent Google OAuth (restricted to CompassX emails)
- **Theme**: Light mode default with dark mode support
- **Design**: Glassmorphism styling, Lato fonts, enterprise-grade McKinsey/Accenture feel
- **Integrations**: None for MVP (simulated)

## User Personas
1. **Project Managers** - Primary users who create and manage projects
2. **PMO Leaders** - Executive oversight of portfolio health
3. **Team Members** - View tasks, update status, track progress

## Core Requirements (Static)
- AI-powered project plan generation from natural language prompts
- Task/milestone/story management
- Sprint planning with Kanban boards
- Resource capacity management
- Portfolio-level dashboards
- AI Copilot for conversational insights

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Recharts + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent Integrations

## What's Been Implemented (March 6, 2025)

### Phase 1: Core Platform (COMPLETE)
- [x] Landing page with Google OAuth login
- [x] Dashboard with stats, velocity/burndown charts
- [x] AI Project Creator - generates full project plans from prompts
- [x] Project Detail page with tabs (Overview, Tasks, Milestones, Stories)
- [x] Sprint Planner with drag-and-drop Kanban board
- [x] Resource Manager with team capacity tracking
- [x] Portfolio Dashboard with project overview table
- [x] AI Copilot chat interface
- [x] Light/Dark mode toggle
- [x] Demo data seeding
- [x] Full test suite (19 backend + 36 frontend tests passing)

### API Endpoints
- `/api/auth/session` - Exchange OAuth session
- `/api/auth/me` - Get current user
- `/api/auth/logout` - Logout
- `/api/projects` - CRUD projects
- `/api/tasks` - CRUD tasks
- `/api/milestones` - CRUD milestones
- `/api/resources` - CRUD resources
- `/api/stories` - CRUD stories
- `/api/dashboard/stats` - Dashboard statistics
- `/api/ai/generate-project` - AI project generation
- `/api/ai/chat` - AI Copilot chat
- `/api/ai/generate-stories` - AI story generation
- `/api/seed-demo-data` - Seed demo data

## Prioritized Backlog

### P0 (Critical)
- All P0 items completed for MVP

### P1 (High Priority - Next Phase)
- [ ] Real GitHub/Jira integration
- [ ] Sprint velocity calculation from actual data
- [ ] AI-generated status reports (executive, team, client)
- [ ] Dependency graph visualization
- [ ] Resource PTO calendar management

### P2 (Medium Priority)
- [ ] Meeting intelligence (upload recordings, extract action items)
- [ ] Scenario simulation ("what if" analysis)
- [ ] Email notifications for milestone risks
- [ ] Comment threads on tasks
- [ ] File attachments

### P3 (Nice to Have)
- [ ] Mobile responsive improvements
- [ ] Export to PDF/Excel
- [ ] Custom dashboard widgets
- [ ] Slack/Teams integration

## Next Tasks
1. Implement AI-generated status reports
2. Add dependency graph visualization
3. Build scenario simulation engine
4. Integrate with GitHub for automated task updates
