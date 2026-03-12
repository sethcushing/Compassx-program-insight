from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI/Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="CompassX - AI Project Intelligence")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== MODELS ==================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    project_id: str = Field(default_factory=lambda: f"proj_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    status: str = "planning"  # planning, active, on_hold, completed
    priority: str = "medium"  # low, medium, high, critical
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    created_by: str
    team_members: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ai_generated: bool = False

class ProjectCreate(BaseModel):
    name: str
    description: str
    priority: str = "medium"
    start_date: Optional[str] = None
    target_date: Optional[str] = None

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:12]}")
    project_id: str
    title: str
    description: str = ""
    status: str = "todo"  # todo, in_progress, in_review, done
    priority: str = "medium"
    assigned_to: Optional[str] = None
    dependencies: List[str] = []
    estimated_hours: float = 0
    actual_hours: float = 0
    sprint: Optional[str] = None
    story_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    priority: str = "medium"
    assigned_to: Optional[str] = None
    estimated_hours: float = 0
    sprint: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    sprint: Optional[str] = None

class Milestone(BaseModel):
    milestone_id: str = Field(default_factory=lambda: f"ms_{uuid.uuid4().hex[:12]}")
    project_id: str
    title: str
    description: str = ""
    target_date: str
    health_status: str = "on_track"  # on_track, at_risk, delayed
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MilestoneCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    target_date: str

class Resource(BaseModel):
    resource_id: str = Field(default_factory=lambda: f"res_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    role: str
    skills: List[str] = []
    availability: float = 100  # percentage
    pto_days: List[str] = []
    user_id: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceCreate(BaseModel):
    name: str
    email: str
    role: str
    skills: List[str] = []
    availability: float = 100

class Story(BaseModel):
    story_id: str = Field(default_factory=lambda: f"story_{uuid.uuid4().hex[:12]}")
    project_id: str
    epic: Optional[str] = None
    title: str
    description: str = ""
    acceptance_criteria: List[str] = []
    status: str = "backlog"  # backlog, ready, in_progress, in_review, done
    priority: str = "medium"
    story_points: int = 0
    sprint_id: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoryCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    epic: Optional[str] = None
    priority: str = "medium"
    story_points: int = 0
    acceptance_criteria: List[str] = []
    sprint_id: Optional[str] = None
    assigned_to: Optional[str] = None

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    epic: Optional[str] = None
    priority: Optional[str] = None
    story_points: Optional[int] = None
    status: Optional[str] = None
    acceptance_criteria: Optional[List[str]] = None
    sprint_id: Optional[str] = None
    assigned_to: Optional[str] = None

class Sprint(BaseModel):
    sprint_id: str = Field(default_factory=lambda: f"sprint_{uuid.uuid4().hex[:12]}")
    project_id: str
    name: str
    goal: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "planning"  # planning, active, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SprintCreate(BaseModel):
    project_id: str
    name: str
    goal: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None

class Risk(BaseModel):
    risk_id: str = Field(default_factory=lambda: f"risk_{uuid.uuid4().hex[:12]}")
    project_id: str
    description: str
    mitigation: str = ""
    probability: str = "medium"  # low, medium, high
    impact: str = "medium"  # low, medium, high
    status: str = "open"  # open, mitigated, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RiskCreate(BaseModel):
    project_id: str
    description: str
    mitigation: str = ""
    probability: str = "medium"
    impact: str = "medium"

class RiskUpdate(BaseModel):
    description: Optional[str] = None
    mitigation: Optional[str] = None
    probability: Optional[str] = None
    impact: Optional[str] = None
    status: Optional[str] = None

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[str] = None
    health_status: Optional[str] = None
    completed: Optional[bool] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[str] = None
    target_date: Optional[str] = None

class Report(BaseModel):
    report_id: str = Field(default_factory=lambda: f"rpt_{uuid.uuid4().hex[:12]}")
    project_id: str
    type: str  # executive, team, client
    title: str
    summary: str
    content: Dict[str, Any] = {}
    generated_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    generated_by: str

class AIProjectRequest(BaseModel):
    prompt: str
    include_milestones: bool = True
    include_tasks: bool = True
    include_stories: bool = True

class AIChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None

class AIStoryRequest(BaseModel):
    project_id: str
    requirements: str

# ================== WEEKLY UPDATE MODELS ==================

class WeeklyUpdate(BaseModel):
    update_id: str = Field(default_factory=lambda: f"update_{uuid.uuid4().hex[:12]}")
    project_id: str
    week_start: str  # ISO date string for week start
    whats_going_well: str = ""
    roadblocks: str = ""
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeeklyUpdateCreate(BaseModel):
    project_id: str
    week_start: str
    whats_going_well: str = ""
    roadblocks: str = ""

class WeeklyUpdateUpdate(BaseModel):
    whats_going_well: Optional[str] = None
    roadblocks: Optional[str] = None

# ================== RAID LOG MODELS ==================
# RAID = Risks, Issues, Action Items, Decisions

class RAIDItem(BaseModel):
    raid_id: str = Field(default_factory=lambda: f"raid_{uuid.uuid4().hex[:12]}")
    project_id: str
    type: str  # risk, issue, action_item, decision
    title: str
    description: str = ""
    owner: Optional[str] = None
    status: str = "open"  # open, closed
    priority: str = "medium"  # low, medium, high, critical
    due_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RAIDItemCreate(BaseModel):
    project_id: str
    type: str
    title: str
    description: str = ""
    owner: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None

class RAIDItemUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None

# ================== CHANGE MANAGEMENT MODELS ==================

class ChangeRequest(BaseModel):
    change_id: str = Field(default_factory=lambda: f"cr_{uuid.uuid4().hex[:12]}")
    project_id: str
    title: str
    description: str = ""
    change_type: str = "feature"  # feature, enhancement, bugfix, infrastructure
    impact: str = "medium"  # low, medium, high, critical
    risk_level: str = "medium"  # low, medium, high
    status: str = "draft"  # draft, pending_review, approved, rejected, implemented
    requested_by: str
    approved_by: Optional[str] = None
    target_date: Optional[str] = None
    implementation_date: Optional[str] = None
    rollback_plan: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChangeRequestCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    change_type: str = "feature"
    impact: str = "medium"
    risk_level: str = "medium"
    target_date: Optional[str] = None
    rollback_plan: str = ""

class ChangeRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    change_type: Optional[str] = None
    impact: Optional[str] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[str] = None
    implementation_date: Optional[str] = None
    rollback_plan: Optional[str] = None

# ================== 4-BLOCKER REPORT MODELS ==================

class FourBlockerReport(BaseModel):
    report_id: str = Field(default_factory=lambda: f"4b_{uuid.uuid4().hex[:12]}")
    project_id: str
    accomplished: List[str] = []
    roadblocks: List[str] = []
    upcoming: List[str] = []
    needs_asks: List[str] = []
    report_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FourBlockerCreate(BaseModel):
    accomplished: List[str] = []
    roadblocks: List[str] = []
    upcoming: List[str] = []
    needs_asks: List[str] = []
    report_date: Optional[str] = None

# ================== AUTH HELPERS ==================

async def get_current_user(request: Request) -> User:
    """Get current user - returns default user (no login required)"""
    # Return default guest user - authentication disabled
    return User(
        user_id="default_user",
        email="guest@compassx.com",
        name="Guest User",
        picture=None,
        created_at=datetime.now(timezone.utc).isoformat()
    )

# ================== AUTH ROUTES ==================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent session_id for a session token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = auth_data.get("email", "")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture", "")
    session_token = auth_data.get("session_token", "")
    
    # Domain restriction: Only allow compassx.com emails
    if not email.endswith("@compassx.com"):
        raise HTTPException(status_code=403, detail="Access restricted to CompassX employees only")
    
    # Find or create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ================== PROJECT ROUTES ==================

@api_router.get("/projects", response_model=List[Dict])
async def get_projects(user: User = Depends(get_current_user)):
    """Get all projects for user"""
    projects = await db.projects.find(
        {"$or": [{"created_by": user.user_id}, {"team_members": user.user_id}]},
        {"_id": 0}
    ).to_list(100)
    
    # Add task counts
    for project in projects:
        task_count = await db.tasks.count_documents({"project_id": project["project_id"]})
        done_count = await db.tasks.count_documents({"project_id": project["project_id"], "status": "done"})
        milestone_count = await db.milestones.count_documents({"project_id": project["project_id"]})
        project["task_count"] = task_count
        project["tasks_done"] = done_count
        project["milestone_count"] = milestone_count
        project["progress"] = int((done_count / task_count * 100) if task_count > 0 else 0)
    
    return projects

@api_router.post("/projects", response_model=Dict)
async def create_project(project: ProjectCreate, user: User = Depends(get_current_user)):
    """Create a new project"""
    new_project = Project(
        name=project.name,
        description=project.description,
        priority=project.priority,
        start_date=project.start_date,
        target_date=project.target_date,
        created_by=user.user_id,
        team_members=[user.user_id]
    )
    
    doc = new_project.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.projects.insert_one(doc)
    
    return {**doc, "_id": None}

@api_router.get("/projects/{project_id}", response_model=Dict)
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    """Get project details"""
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Add related data
    tasks = await db.tasks.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    milestones = await db.milestones.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    stories = await db.stories.find({"project_id": project_id}, {"_id": 0}).to_list(200)
    risks = await db.risks.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    sprints = await db.sprints.find({"project_id": project_id}, {"_id": 0}).to_list(50)
    
    # Add sprint stats
    for sprint in sprints:
        sprint_stories = [s for s in stories if s.get("sprint_id") == sprint["sprint_id"]]
        sprint["total_stories"] = len(sprint_stories)
        sprint["completed_stories"] = len([s for s in sprint_stories if s["status"] == "done"])
        sprint["total_points"] = sum([s.get("story_points", 0) for s in sprint_stories])
        sprint["completed_points"] = sum([s.get("story_points", 0) for s in sprint_stories if s["status"] == "done"])
    
    project["tasks"] = tasks
    project["milestones"] = milestones
    project["stories"] = stories
    project["risks"] = risks
    project["sprints"] = sprints
    
    return project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    """Delete a project"""
    result = await db.projects.delete_one({"project_id": project_id, "created_by": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Clean up related data
    await db.tasks.delete_many({"project_id": project_id})
    await db.milestones.delete_many({"project_id": project_id})
    await db.stories.delete_many({"project_id": project_id})
    await db.risks.delete_many({"project_id": project_id})
    await db.sprints.delete_many({"project_id": project_id})
    await db.raid_items.delete_many({"project_id": project_id})
    await db.change_requests.delete_many({"project_id": project_id})
    await db.weekly_updates.delete_many({"project_id": project_id})
    await db.four_blocker_reports.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted"}

# ================== TASK ROUTES ==================

@api_router.get("/tasks", response_model=List[Dict])
async def get_tasks(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get tasks, optionally filtered by project"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(500)
    return tasks

@api_router.post("/tasks", response_model=Dict)
async def create_task(task: TaskCreate, user: User = Depends(get_current_user)):
    """Create a new task"""
    new_task = Task(
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        assigned_to=task.assigned_to,
        estimated_hours=task.estimated_hours,
        sprint=task.sprint
    )
    
    doc = new_task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    
    return {**doc, "_id": None}

@api_router.patch("/tasks/{task_id}", response_model=Dict)
async def update_task(task_id: str, update: TaskUpdate, user: User = Depends(get_current_user)):
    """Update a task"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.tasks.update_one({"task_id": task_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    """Delete a task"""
    result = await db.tasks.delete_one({"task_id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ================== MILESTONE ROUTES ==================

@api_router.get("/milestones", response_model=List[Dict])
async def get_milestones(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get milestones"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    milestones = await db.milestones.find(query, {"_id": 0}).to_list(100)
    return milestones

@api_router.post("/milestones", response_model=Dict)
async def create_milestone(milestone: MilestoneCreate, user: User = Depends(get_current_user)):
    """Create a milestone"""
    new_milestone = Milestone(
        project_id=milestone.project_id,
        title=milestone.title,
        description=milestone.description,
        target_date=milestone.target_date
    )
    
    doc = new_milestone.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.milestones.insert_one(doc)
    
    return {**doc, "_id": None}

# ================== RESOURCE ROUTES ==================

@api_router.get("/resources", response_model=List[Dict])
async def get_resources(user: User = Depends(get_current_user)):
    """Get all resources"""
    resources = await db.resources.find({}, {"_id": 0}).to_list(100)
    return resources

@api_router.post("/resources", response_model=Dict)
async def create_resource(resource: ResourceCreate, user: User = Depends(get_current_user)):
    """Create a resource"""
    new_resource = Resource(
        name=resource.name,
        email=resource.email,
        role=resource.role,
        skills=resource.skills,
        availability=resource.availability
    )
    
    doc = new_resource.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.resources.insert_one(doc)
    
    return {**doc, "_id": None}

# ================== STORY ROUTES ==================

@api_router.get("/stories", response_model=List[Dict])
async def get_stories(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get stories"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    stories = await db.stories.find(query, {"_id": 0}).to_list(200)
    return stories

@api_router.post("/stories", response_model=Dict)
async def create_story(story: StoryCreate, user: User = Depends(get_current_user)):
    """Create a story"""
    new_story = Story(
        project_id=story.project_id,
        title=story.title,
        description=story.description,
        epic=story.epic,
        priority=story.priority,
        story_points=story.story_points,
        acceptance_criteria=story.acceptance_criteria,
        sprint_id=story.sprint_id,
        assigned_to=story.assigned_to
    )
    
    doc = new_story.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.stories.insert_one(doc)
    
    return {**doc, "_id": None}

@api_router.patch("/stories/{story_id}", response_model=Dict)
async def update_story(story_id: str, update: StoryUpdate, user: User = Depends(get_current_user)):
    """Update a story"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.stories.update_one({"story_id": story_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    return story

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, user: User = Depends(get_current_user)):
    """Delete a story"""
    result = await db.stories.delete_one({"story_id": story_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story not found")
    return {"message": "Story deleted"}

# ================== SPRINT ROUTES ==================

@api_router.get("/sprints", response_model=List[Dict])
async def get_sprints(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get sprints"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    sprints = await db.sprints.find(query, {"_id": 0}).to_list(100)
    
    # Add story counts for each sprint
    for sprint in sprints:
        stories = await db.stories.find({"sprint_id": sprint["sprint_id"]}, {"_id": 0}).to_list(500)
        sprint["total_stories"] = len(stories)
        sprint["completed_stories"] = len([s for s in stories if s["status"] == "done"])
        sprint["total_points"] = sum([s.get("story_points", 0) for s in stories])
        sprint["completed_points"] = sum([s.get("story_points", 0) for s in stories if s["status"] == "done"])
    
    return sprints

@api_router.post("/sprints", response_model=Dict)
async def create_sprint(sprint: SprintCreate, user: User = Depends(get_current_user)):
    """Create a sprint"""
    new_sprint = Sprint(
        project_id=sprint.project_id,
        name=sprint.name,
        goal=sprint.goal,
        start_date=sprint.start_date,
        end_date=sprint.end_date
    )
    
    doc = new_sprint.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.sprints.insert_one(doc)
    
    return {**doc, "_id": None}

@api_router.patch("/sprints/{sprint_id}", response_model=Dict)
async def update_sprint(sprint_id: str, update: SprintUpdate, user: User = Depends(get_current_user)):
    """Update a sprint"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.sprints.update_one({"sprint_id": sprint_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    sprint = await db.sprints.find_one({"sprint_id": sprint_id}, {"_id": 0})
    return sprint

@api_router.delete("/sprints/{sprint_id}")
async def delete_sprint(sprint_id: str, user: User = Depends(get_current_user)):
    """Delete a sprint"""
    # Unassign stories from this sprint
    await db.stories.update_many({"sprint_id": sprint_id}, {"$set": {"sprint_id": None}})
    
    result = await db.sprints.delete_one({"sprint_id": sprint_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return {"message": "Sprint deleted"}

# ================== RISK ROUTES ==================

@api_router.get("/risks", response_model=List[Dict])
async def get_risks(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get risks"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    risks = await db.risks.find(query, {"_id": 0}).to_list(200)
    return risks

@api_router.post("/risks", response_model=Dict)
async def create_risk(risk: RiskCreate, user: User = Depends(get_current_user)):
    """Create a risk"""
    new_risk = Risk(
        project_id=risk.project_id,
        description=risk.description,
        mitigation=risk.mitigation,
        probability=risk.probability,
        impact=risk.impact
    )
    
    doc = new_risk.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.risks.insert_one(doc)
    
    return {**doc, "_id": None}

@api_router.patch("/risks/{risk_id}", response_model=Dict)
async def update_risk(risk_id: str, update: RiskUpdate, user: User = Depends(get_current_user)):
    """Update a risk"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.risks.update_one({"risk_id": risk_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    risk = await db.risks.find_one({"risk_id": risk_id}, {"_id": 0})
    return risk

@api_router.delete("/risks/{risk_id}")
async def delete_risk(risk_id: str, user: User = Depends(get_current_user)):
    """Delete a risk"""
    result = await db.risks.delete_one({"risk_id": risk_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Risk not found")
    return {"message": "Risk deleted"}

# ================== MILESTONE ROUTES (EXTENDED) ==================

@api_router.patch("/milestones/{milestone_id}", response_model=Dict)
async def update_milestone(milestone_id: str, update: MilestoneUpdate, user: User = Depends(get_current_user)):
    """Update a milestone"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.milestones.update_one({"milestone_id": milestone_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    milestone = await db.milestones.find_one({"milestone_id": milestone_id}, {"_id": 0})
    return milestone

@api_router.delete("/milestones/{milestone_id}")
async def delete_milestone(milestone_id: str, user: User = Depends(get_current_user)):
    """Delete a milestone"""
    result = await db.milestones.delete_one({"milestone_id": milestone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return {"message": "Milestone deleted"}

# ================== PROJECT ROUTES (EXTENDED) ==================

@api_router.patch("/projects/{project_id}", response_model=Dict)
async def update_project(project_id: str, update: ProjectUpdate, user: User = Depends(get_current_user)):
    """Update a project"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.projects.update_one({"project_id": project_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return project

# ================== REPORT ROUTES ==================

@api_router.get("/reports", response_model=List[Dict])
async def get_reports(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get reports"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    reports = await db.reports.find(query, {"_id": 0}).to_list(50)
    return reports

# ================== AI ROUTES ==================

@api_router.post("/ai/generate-project")
async def ai_generate_project(req: AIProjectRequest, user: User = Depends(get_current_user)):
    """Generate a full project plan from a prompt using AI"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    system_prompt = """You are an expert project manager and planning AI. When given a project idea, generate a comprehensive project plan in JSON format.

The response must be valid JSON with this structure:
{
    "name": "Project Name",
    "description": "Detailed project description",
    "priority": "high|medium|low",
    "estimated_duration_weeks": number,
    "phases": [
        {
            "name": "Phase Name",
            "description": "Phase description",
            "duration_weeks": number,
            "order": number
        }
    ],
    "milestones": [
        {
            "title": "Milestone Title",
            "description": "What this milestone represents",
            "week_target": number
        }
    ],
    "tasks": [
        {
            "title": "Task Title",
            "description": "Task details",
            "priority": "high|medium|low",
            "estimated_hours": number,
            "phase": "Phase Name",
            "dependencies": []
        }
    ],
    "stories": [
        {
            "title": "As a [user], I want [feature] so that [benefit]",
            "description": "Story description",
            "acceptance_criteria": ["Criteria 1", "Criteria 2"],
            "story_points": number,
            "epic": "Epic Name"
        }
    ],
    "risks": [
        {
            "description": "Risk description",
            "mitigation": "How to mitigate",
            "probability": "high|medium|low",
            "impact": "high|medium|low"
        }
    ]
}

Generate realistic, detailed plans. Include 3-5 phases, 4-8 milestones, 15-25 tasks, and 8-15 user stories.
Only respond with the JSON, no other text."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"project_gen_{user.user_id}_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=f"Generate a comprehensive project plan for: {req.prompt}")
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        # Clean up response if needed
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        plan = json.loads(response_text.strip())
        
        # Calculate dates
        start_date = datetime.now(timezone.utc)
        duration_weeks = plan.get("estimated_duration_weeks", 12)
        target_date = start_date + timedelta(weeks=duration_weeks)
        
        # Create the project
        project = Project(
            name=plan["name"],
            description=plan["description"],
            priority=plan.get("priority", "medium"),
            start_date=start_date.strftime("%Y-%m-%d"),
            target_date=target_date.strftime("%Y-%m-%d"),
            created_by=user.user_id,
            team_members=[user.user_id],
            ai_generated=True
        )
        
        project_doc = project.model_dump()
        project_doc["created_at"] = project_doc["created_at"].isoformat()
        project_doc["phases"] = plan.get("phases", [])
        project_doc["risks"] = plan.get("risks", [])
        await db.projects.insert_one(project_doc)
        
        # Create milestones
        if req.include_milestones:
            for ms in plan.get("milestones", []):
                week_target = ms.get("week_target", 4)
                ms_date = start_date + timedelta(weeks=week_target)
                milestone = Milestone(
                    project_id=project.project_id,
                    title=ms["title"],
                    description=ms.get("description", ""),
                    target_date=ms_date.strftime("%Y-%m-%d")
                )
                ms_doc = milestone.model_dump()
                ms_doc["created_at"] = ms_doc["created_at"].isoformat()
                await db.milestones.insert_one(ms_doc)
        
        # Create tasks
        if req.include_tasks:
            for task_data in plan.get("tasks", []):
                task = Task(
                    project_id=project.project_id,
                    title=task_data["title"],
                    description=task_data.get("description", ""),
                    priority=task_data.get("priority", "medium"),
                    estimated_hours=task_data.get("estimated_hours", 8)
                )
                task_doc = task.model_dump()
                task_doc["created_at"] = task_doc["created_at"].isoformat()
                task_doc["phase"] = task_data.get("phase", "")
                await db.tasks.insert_one(task_doc)
        
        # Create stories
        if req.include_stories:
            for story_data in plan.get("stories", []):
                story = Story(
                    project_id=project.project_id,
                    title=story_data["title"],
                    description=story_data.get("description", ""),
                    acceptance_criteria=story_data.get("acceptance_criteria", []),
                    story_points=story_data.get("story_points", 3),
                    epic=story_data.get("epic", "")
                )
                story_doc = story.model_dump()
                story_doc["created_at"] = story_doc["created_at"].isoformat()
                await db.stories.insert_one(story_doc)
        
        # Return complete project
        return await get_project(project.project_id, user)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/chat")
async def ai_chat(req: AIChatRequest, user: User = Depends(get_current_user)):
    """AI Copilot chat for project insights"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Build context
    context_parts = []
    
    if req.project_id:
        project = await db.projects.find_one({"project_id": req.project_id}, {"_id": 0})
        if project:
            context_parts.append(f"Current Project: {project['name']}\nDescription: {project['description']}\nStatus: {project['status']}")
            
            tasks = await db.tasks.find({"project_id": req.project_id}, {"_id": 0}).to_list(100)
            if tasks:
                todo = len([t for t in tasks if t['status'] == 'todo'])
                in_progress = len([t for t in tasks if t['status'] == 'in_progress'])
                done = len([t for t in tasks if t['status'] == 'done'])
                context_parts.append(f"Tasks: {todo} todo, {in_progress} in progress, {done} done")
            
            milestones = await db.milestones.find({"project_id": req.project_id}, {"_id": 0}).to_list(50)
            if milestones:
                at_risk = len([m for m in milestones if m['health_status'] == 'at_risk'])
                delayed = len([m for m in milestones if m['health_status'] == 'delayed'])
                context_parts.append(f"Milestones: {len(milestones)} total, {at_risk} at risk, {delayed} delayed")
    else:
        # Get all projects summary
        projects = await db.projects.find({"$or": [{"created_by": user.user_id}, {"team_members": user.user_id}]}, {"_id": 0}).to_list(20)
        if projects:
            context_parts.append(f"User has {len(projects)} projects")
            for p in projects[:5]:
                context_parts.append(f"- {p['name']}: {p['status']}")
    
    context = "\n".join(context_parts) if context_parts else "No project data available."
    
    system_prompt = f"""You are an AI Project Copilot for CompassX, an enterprise project management platform. You help project managers with insights, recommendations, and answers about their projects.

Current Context:
{context}

Be concise but helpful. Provide actionable insights when possible. If asked about specific metrics or data you don't have, acknowledge that and suggest what data would be helpful."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"copilot_{user.user_id}_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=req.message)
        response = await chat.send_message(user_message)
        
        return {"response": response, "context_used": bool(context_parts)}
        
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/generate-stories")
async def ai_generate_stories(req: AIStoryRequest, user: User = Depends(get_current_user)):
    """Generate user stories from requirements"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    system_prompt = """You are an expert agile coach and business analyst. Convert requirements into well-structured user stories.

Respond with a JSON array of stories:
[
    {
        "title": "As a [user type], I want [feature] so that [benefit]",
        "description": "Detailed story description",
        "acceptance_criteria": ["AC1", "AC2", "AC3"],
        "story_points": 1-13,
        "epic": "Epic name",
        "priority": "high|medium|low"
    }
]

Follow best practices:
- Stories should be INVEST compliant (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Include clear acceptance criteria
- Group related stories under epics
- Use Fibonacci for story points (1, 2, 3, 5, 8, 13)

Only respond with the JSON array, no other text."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"stories_{user.user_id}_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=f"Generate user stories for these requirements:\n\n{req.requirements}")
        response = await chat.send_message(user_message)
        
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        stories_data = json.loads(response_text.strip())
        
        created_stories = []
        for story_data in stories_data:
            story = Story(
                project_id=req.project_id,
                title=story_data["title"],
                description=story_data.get("description", ""),
                acceptance_criteria=story_data.get("acceptance_criteria", []),
                story_points=story_data.get("story_points", 3),
                epic=story_data.get("epic", ""),
                priority=story_data.get("priority", "medium")
            )
            story_doc = story.model_dump()
            story_doc["created_at"] = story_doc["created_at"].isoformat()
            await db.stories.insert_one(story_doc)
            created_stories.append({**story_doc, "_id": None})
        
        return {"stories": created_stories, "count": len(created_stories)}
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"AI story generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================== DASHBOARD/ANALYTICS ROUTES ==================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    # Projects
    projects = await db.projects.find(
        {"$or": [{"created_by": user.user_id}, {"team_members": user.user_id}]},
        {"_id": 0}
    ).to_list(100)
    
    project_ids = [p["project_id"] for p in projects]
    
    # Tasks
    all_tasks = await db.tasks.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(1000)
    tasks_by_status = {
        "todo": len([t for t in all_tasks if t["status"] == "todo"]),
        "in_progress": len([t for t in all_tasks if t["status"] == "in_progress"]),
        "in_review": len([t for t in all_tasks if t["status"] == "in_review"]),
        "done": len([t for t in all_tasks if t["status"] == "done"])
    }
    
    # Stories and Story Points
    all_stories = await db.stories.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(1000)
    total_story_points = sum([s.get("story_points", 0) for s in all_stories])
    completed_story_points = sum([s.get("story_points", 0) for s in all_stories if s["status"] == "done"])
    
    stories_by_status = {
        "backlog": len([s for s in all_stories if s["status"] == "backlog"]),
        "ready": len([s for s in all_stories if s["status"] == "ready"]),
        "in_progress": len([s for s in all_stories if s["status"] == "in_progress"]),
        "in_review": len([s for s in all_stories if s["status"] == "in_review"]),
        "done": len([s for s in all_stories if s["status"] == "done"])
    }
    
    # Milestones
    all_milestones = await db.milestones.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(200)
    milestones_by_health = {
        "on_track": len([m for m in all_milestones if m["health_status"] == "on_track"]),
        "at_risk": len([m for m in all_milestones if m["health_status"] == "at_risk"]),
        "delayed": len([m for m in all_milestones if m["health_status"] == "delayed"])
    }
    
    # Resources
    resources = await db.resources.find({}, {"_id": 0}).to_list(100)
    
    # Story points by sprint (for chart)
    sprints = await db.sprints.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(50)
    story_points_data = []
    for sprint in sprints[-6:]:  # Last 6 sprints
        sprint_stories = [s for s in all_stories if s.get("sprint_id") == sprint["sprint_id"]]
        story_points_data.append({
            "sprint": sprint["name"],
            "total": sum([s.get("story_points", 0) for s in sprint_stories]),
            "completed": sum([s.get("story_points", 0) for s in sprint_stories if s["status"] == "done"])
        })
    
    # If no real sprint data, provide sample
    if not story_points_data:
        story_points_data = [
            {"sprint": "Sprint 1", "total": 21, "completed": 18},
            {"sprint": "Sprint 2", "total": 26, "completed": 24},
            {"sprint": "Sprint 3", "total": 34, "completed": 29},
            {"sprint": "Sprint 4", "total": 29, "completed": 27},
            {"sprint": "Sprint 5", "total": 31, "completed": 28},
            {"sprint": "Sprint 6", "total": 38, "completed": 32}
        ]
    
    # Burndown data (simulated)
    burndown_data = [
        {"day": "Mon", "remaining": 45, "ideal": 50},
        {"day": "Tue", "remaining": 42, "ideal": 42},
        {"day": "Wed", "remaining": 38, "ideal": 34},
        {"day": "Thu", "remaining": 30, "ideal": 26},
        {"day": "Fri", "remaining": 22, "ideal": 18}
    ]
    
    return {
        "projects": {
            "total": len(projects),
            "active": len([p for p in projects if p["status"] == "active"]),
            "completed": len([p for p in projects if p["status"] == "completed"]),
            "at_risk": len([p for p in projects if p.get("status") == "at_risk"])
        },
        "tasks": tasks_by_status,
        "stories": stories_by_status,
        "milestones": milestones_by_health,
        "resources": {
            "total": len(resources),
            "available": len([r for r in resources if r["availability"] > 50])
        },
        "story_points_data": story_points_data,
        "burndown_data": burndown_data,
        "total_story_points": total_story_points,
        "completed_story_points": completed_story_points
    }

@api_router.get("/dashboard/quick-access")
async def get_dashboard_quick_access(user: User = Depends(get_current_user)):
    """Get milestones and RAID items across all projects for dashboard quick access"""
    projects = await db.projects.find(
        {"$or": [{"created_by": user.user_id}, {"team_members": user.user_id}]},
        {"_id": 0, "project_id": 1, "name": 1}
    ).to_list(100)
    project_map = {p["project_id"]: p["name"] for p in projects}
    project_ids = list(project_map.keys())

    milestones = await db.milestones.find(
        {"project_id": {"$in": project_ids}},
        {"_id": 0}
    ).to_list(200)
    for m in milestones:
        m["project_name"] = project_map.get(m["project_id"], "Unknown")

    raid_items = await db.raid_items.find(
        {"project_id": {"$in": project_ids}},
        {"_id": 0}
    ).to_list(500)
    for r in raid_items:
        r["project_name"] = project_map.get(r["project_id"], "Unknown")

    return {
        "milestones": milestones,
        "raid_items": raid_items
    }

@api_router.get("/stories/all")
async def get_all_stories(user: User = Depends(get_current_user)):
    """Get stories across all projects"""
    projects = await db.projects.find(
        {"$or": [{"created_by": user.user_id}, {"team_members": user.user_id}]},
        {"_id": 0, "project_id": 1, "name": 1}
    ).to_list(100)
    project_map = {p["project_id"]: p["name"] for p in projects}
    project_ids = list(project_map.keys())

    stories = await db.stories.find(
        {"project_id": {"$in": project_ids}},
        {"_id": 0}
    ).to_list(1000)
    for s in stories:
        s["project_name"] = project_map.get(s["project_id"], "Unknown")
    return stories



# ================== WEEKLY UPDATE ROUTES ==================

@api_router.get("/weekly-updates", response_model=List[Dict])
async def get_weekly_updates(project_id: str, user: User = Depends(get_current_user)):
    """Get all weekly updates for a project"""
    updates = await db.weekly_updates.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("week_start", -1).to_list(100)
    return updates

@api_router.post("/weekly-updates", response_model=Dict)
async def create_weekly_update(update: WeeklyUpdateCreate, user: User = Depends(get_current_user)):
    """Create a weekly update"""
    new_update = WeeklyUpdate(
        project_id=update.project_id,
        week_start=update.week_start,
        whats_going_well=update.whats_going_well,
        roadblocks=update.roadblocks,
        created_by=user.user_id
    )
    doc = new_update.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.weekly_updates.insert_one(doc)
    return {**doc, "_id": None}

@api_router.patch("/weekly-updates/{update_id}", response_model=Dict)
async def update_weekly_update(update_id: str, update: WeeklyUpdateUpdate, user: User = Depends(get_current_user)):
    """Update a weekly update"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.weekly_updates.update_one({"update_id": update_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Weekly update not found")
    
    doc = await db.weekly_updates.find_one({"update_id": update_id}, {"_id": 0})
    return doc

@api_router.delete("/weekly-updates/{update_id}")
async def delete_weekly_update(update_id: str, user: User = Depends(get_current_user)):
    """Delete a weekly update"""
    result = await db.weekly_updates.delete_one({"update_id": update_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Weekly update not found")
    return {"message": "Weekly update deleted"}

# ================== RAID LOG ROUTES ==================

@api_router.get("/raid-items", response_model=List[Dict])
async def get_raid_items(project_id: str, user: User = Depends(get_current_user)):
    """Get all RAID items for a project"""
    items = await db.raid_items.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(200)
    return items

@api_router.post("/raid-items", response_model=Dict)
async def create_raid_item(item: RAIDItemCreate, user: User = Depends(get_current_user)):
    """Create a RAID item"""
    new_item = RAIDItem(
        project_id=item.project_id,
        type=item.type,
        title=item.title,
        description=item.description,
        owner=item.owner,
        due_date=item.due_date
    )
    doc = new_item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.raid_items.insert_one(doc)
    return {**doc, "_id": None}

@api_router.patch("/raid-items/{raid_id}", response_model=Dict)
async def update_raid_item(raid_id: str, update: RAIDItemUpdate, user: User = Depends(get_current_user)):
    """Update a RAID item"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.raid_items.update_one({"raid_id": raid_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="RAID item not found")
    
    doc = await db.raid_items.find_one({"raid_id": raid_id}, {"_id": 0})
    return doc

@api_router.delete("/raid-items/{raid_id}")
async def delete_raid_item(raid_id: str, user: User = Depends(get_current_user)):
    """Delete a RAID item"""
    result = await db.raid_items.delete_one({"raid_id": raid_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RAID item not found")
    return {"message": "RAID item deleted"}

# ================== CHANGE MANAGEMENT ROUTES ==================

@api_router.get("/change-requests", response_model=List[Dict])
async def get_change_requests(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get change requests, optionally filtered by project"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    requests = await db.change_requests.find(query, {"_id": 0}).to_list(200)
    return requests

@api_router.post("/change-requests", response_model=Dict)
async def create_change_request(req: ChangeRequestCreate, user: User = Depends(get_current_user)):
    """Create a change request"""
    new_request = ChangeRequest(
        project_id=req.project_id,
        title=req.title,
        description=req.description,
        change_type=req.change_type,
        impact=req.impact,
        risk_level=req.risk_level,
        target_date=req.target_date,
        rollback_plan=req.rollback_plan,
        requested_by=user.user_id
    )
    doc = new_request.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.change_requests.insert_one(doc)
    return {**doc, "_id": None}

@api_router.patch("/change-requests/{change_id}", response_model=Dict)
async def update_change_request(change_id: str, update: ChangeRequestUpdate, user: User = Depends(get_current_user)):
    """Update a change request"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Track approval
    if update_data.get("status") == "approved":
        update_data["approved_by"] = user.user_id
    
    result = await db.change_requests.update_one({"change_id": change_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Change request not found")
    
    doc = await db.change_requests.find_one({"change_id": change_id}, {"_id": 0})
    return doc

@api_router.delete("/change-requests/{change_id}")
async def delete_change_request(change_id: str, user: User = Depends(get_current_user)):
    """Delete a change request"""
    result = await db.change_requests.delete_one({"change_id": change_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Change request not found")
    return {"message": "Change request deleted"}

@api_router.get("/change-management/dashboard")
async def get_change_management_dashboard(user: User = Depends(get_current_user)):
    """Get change management dashboard stats"""
    # Get all change requests
    all_requests = await db.change_requests.find({}, {"_id": 0}).to_list(500)
    
    # Get project info for each request
    project_ids = list(set([r["project_id"] for r in all_requests]))
    projects = await db.projects.find({"project_id": {"$in": project_ids}}, {"_id": 0, "project_id": 1, "name": 1}).to_list(100)
    project_map = {p["project_id"]: p["name"] for p in projects}
    
    # Add project names to requests
    for req in all_requests:
        req["project_name"] = project_map.get(req["project_id"], "Unknown")
    
    # Stats by status
    by_status = {
        "draft": len([r for r in all_requests if r["status"] == "draft"]),
        "pending_review": len([r for r in all_requests if r["status"] == "pending_review"]),
        "approved": len([r for r in all_requests if r["status"] == "approved"]),
        "rejected": len([r for r in all_requests if r["status"] == "rejected"]),
        "implemented": len([r for r in all_requests if r["status"] == "implemented"])
    }
    
    # Stats by impact
    by_impact = {
        "low": len([r for r in all_requests if r["impact"] == "low"]),
        "medium": len([r for r in all_requests if r["impact"] == "medium"]),
        "high": len([r for r in all_requests if r["impact"] == "high"]),
        "critical": len([r for r in all_requests if r["impact"] == "critical"])
    }
    
    # Pending approval requests
    pending_approval = [r for r in all_requests if r["status"] == "pending_review"]
    
    return {
        "total_requests": len(all_requests),
        "by_status": by_status,
        "by_impact": by_impact,
        "pending_approval": pending_approval,
        "recent_requests": sorted(all_requests, key=lambda x: x.get("created_at", ""), reverse=True)[:10]
    }

# ================== 4-BLOCKER REPORT ROUTES ==================

@api_router.get("/projects/{project_id}/four-blocker")
async def get_four_blocker(project_id: str, user: User = Depends(get_current_user)):
    """Get the latest 4-blocker report for a project"""
    report = await db.four_blocker_reports.find_one(
        {"project_id": project_id}, {"_id": 0}, sort=[("created_at", -1)]
    )
    return report or {"project_id": project_id, "accomplished": [], "roadblocks": [], "upcoming": [], "needs_asks": [], "report_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}

@api_router.get("/projects/{project_id}/four-blocker/history")
async def get_four_blocker_history(project_id: str, user: User = Depends(get_current_user)):
    """Get all 4-blocker reports for a project"""
    reports = await db.four_blocker_reports.find(
        {"project_id": project_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return reports

@api_router.post("/projects/{project_id}/four-blocker")
async def save_four_blocker(project_id: str, data: FourBlockerCreate, user: User = Depends(get_current_user)):
    """Save a 4-blocker report for a project"""
    report = FourBlockerReport(
        project_id=project_id,
        accomplished=data.accomplished,
        roadblocks=data.roadblocks,
        upcoming=data.upcoming,
        needs_asks=data.needs_asks,
        report_date=data.report_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    await db.four_blocker_reports.insert_one(report.dict())
    result = report.dict()
    result.pop("_id", None)
    return result

@api_router.get("/projects/{project_id}/four-blocker/export")
async def export_four_blocker_pdf(project_id: str, user: User = Depends(get_current_user)):
    """Export the latest 4-blocker report as PDF"""
    from fpdf import FPDF
    import io

    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    report = await db.four_blocker_reports.find_one(
        {"project_id": project_id}, {"_id": 0}, sort=[("created_at", -1)]
    )
    if not report:
        raise HTTPException(status_code=404, detail="No 4-blocker report found. Please save one first.")

    pdf = FPDF(orientation='L', unit='mm', format='A4')
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    page_w = 297
    page_h = 210
    margin = 10
    content_w = page_w - 2 * margin
    header_h = 22
    quadrant_w = content_w / 2
    quadrant_h = (page_h - 2 * margin - header_h - 4) / 2

    # Header background
    pdf.set_fill_color(30, 64, 175)
    pdf.rect(margin, margin, content_w, header_h, 'F')
    pdf.set_font('Helvetica', 'B', 16)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(margin + 5, margin + 2)
    pdf.cell(0, 10, f"4-Blocker: {project['name']}", ln=True)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_xy(margin + 5, margin + 12)
    pdf.cell(0, 6, f"Report Date: {report.get('report_date', 'N/A')}    |    Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y')}")

    top_y = margin + header_h + 2
    gap = 2

    quadrants = [
        {"title": "WHAT'S BEEN ACCOMPLISHED", "items": report.get("accomplished", []), "color": (22, 163, 74), "x": margin, "y": top_y},
        {"title": "ROADBLOCKS", "items": report.get("roadblocks", []), "color": (220, 38, 38), "x": margin + quadrant_w + gap, "y": top_y},
        {"title": "UPCOMING", "items": report.get("upcoming", []), "color": (37, 99, 235), "x": margin, "y": top_y + quadrant_h + gap},
        {"title": "NEEDS / ASKS", "items": report.get("needs_asks", []), "color": (217, 119, 6), "x": margin + quadrant_w + gap, "y": top_y + quadrant_h + gap},
    ]

    for q in quadrants:
        r, g, b = q["color"]
        # Quadrant header bar
        pdf.set_fill_color(r, g, b)
        pdf.rect(q["x"], q["y"], quadrant_w, 8, 'F')
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(q["x"] + 3, q["y"] + 1)
        pdf.cell(quadrant_w - 6, 6, q["title"])

        # Quadrant body
        body_y = q["y"] + 8
        body_h = quadrant_h - 8
        pdf.set_draw_color(r, g, b)
        pdf.rect(q["x"], body_y, quadrant_w, body_h, 'D')

        pdf.set_font('Helvetica', '', 9)
        pdf.set_text_color(30, 30, 30)
        item_y = body_y + 3
        for item in q["items"]:
            if item_y + 5 > q["y"] + quadrant_h - 2:
                break
            pdf.set_xy(q["x"] + 4, item_y)
            pdf.cell(3, 4, "-")
            pdf.set_xy(q["x"] + 8, item_y)
            pdf.multi_cell(quadrant_w - 12, 4.5, item)
            item_y = pdf.get_y() + 1

    pdf_bytes = pdf.output()
    safe_name = project['name'].replace(' ', '_').replace('/', '-')
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="4Blocker_{safe_name}_{report.get("report_date","")}.pdf"'}
    )

# ================== SEED DATA ==================

@api_router.post("/seed-demo-data")
async def seed_demo_data(user: User = Depends(get_current_user)):
    """Seed demo data for the platform - Custom team and projects"""
    
    # Clear existing demo data first
    await db.projects.delete_many({"created_by": user.user_id})
    await db.tasks.delete_many({})
    await db.stories.delete_many({})
    await db.sprints.delete_many({})
    await db.milestones.delete_many({})
    await db.risks.delete_many({})
    await db.resources.delete_many({})
    await db.raid_items.delete_many({})
    await db.weekly_updates.delete_many({})
    await db.change_requests.delete_many({})
    
    # Team Members
    team_members = [
        {"name": "Paddy", "email": "paddy@compassx.com", "role": "Program Director", "skills": ["Strategy", "Leadership", "Stakeholder Management"], "availability": 100},
        {"name": "Seth", "email": "seth@compassx.com", "role": "Technical Lead", "skills": ["Architecture", "Python", "Cloud", "Integration"], "availability": 100},
        {"name": "Brian", "email": "brian@compassx.com", "role": "Senior Developer", "skills": ["React", "TypeScript", "API Design"], "availability": 100},
        {"name": "Ashley", "email": "ashley@compassx.com", "role": "Product Manager", "skills": ["Agile", "Requirements", "User Research", "AI/ML"], "availability": 100},
        {"name": "Fifi", "email": "fifi@compassx.com", "role": "Business Analyst", "skills": ["Data Analysis", "Process Design", "Requirements"], "availability": 100},
        {"name": "Charlene", "email": "charlene@compassx.com", "role": "Change Manager", "skills": ["Change Management", "Training", "Communications"], "availability": 100},
        {"name": "Sandeep", "email": "sandeep@compassx.com", "role": "QA Lead", "skills": ["Test Automation", "Performance Testing", "Security Testing"], "availability": 100}
    ]
    
    resource_map = {}
    for member in team_members:
        res_doc = {
            "resource_id": f"res_{uuid.uuid4().hex[:12]}",
            "pto_days": [],
            "user_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **member
        }
        await db.resources.insert_one(res_doc)
        resource_map[member["name"]] = res_doc["resource_id"]
    
    # Projects with owners and production release focus
    projects_config = [
        {
            "name": "BOM Grid v1.0",
            "description": "Bill of Materials Grid application for manufacturing operations - comprehensive BOM management with real-time collaboration and approval workflows.",
            "owner": "Fifi",
            "status": "active",
            "priority": "high",
            "start_date": "2024-09-01",
            "target_date": "2025-03-31",
            "phases": [
                {"name": "Discovery & Requirements", "order": 1, "duration_weeks": 4},
                {"name": "Design & Architecture", "order": 2, "duration_weeks": 6},
                {"name": "Development Sprint 1-4", "order": 3, "duration_weeks": 12},
                {"name": "UAT & Bug Fixes", "order": 4, "duration_weeks": 4},
                {"name": "Production Release", "order": 5, "duration_weeks": 2}
            ]
        },
        {
            "name": "Digital Intake Co-Pilot",
            "description": "AI-powered digital intake system that streamlines customer onboarding with intelligent form completion and document processing.",
            "owner": "Ashley",
            "status": "active",
            "priority": "high",
            "start_date": "2024-10-15",
            "target_date": "2025-04-15",
            "phases": [
                {"name": "AI Model Selection", "order": 1, "duration_weeks": 3},
                {"name": "UX Design", "order": 2, "duration_weeks": 4},
                {"name": "Core Development", "order": 3, "duration_weeks": 14},
                {"name": "Integration Testing", "order": 4, "duration_weeks": 3},
                {"name": "Production Release", "order": 5, "duration_weeks": 2}
            ]
        },
        {
            "name": "CPQ Reimagined",
            "description": "Next-generation Configure-Price-Quote platform with AI-driven pricing recommendations and streamlined approval workflows.",
            "owner": "Seth",
            "status": "active",
            "priority": "critical",
            "start_date": "2024-08-01",
            "target_date": "2025-02-28",
            "phases": [
                {"name": "Current State Analysis", "order": 1, "duration_weeks": 4},
                {"name": "Solution Design", "order": 2, "duration_weeks": 6},
                {"name": "Build & Configure", "order": 3, "duration_weeks": 16},
                {"name": "Data Migration", "order": 4, "duration_weeks": 4},
                {"name": "Production Release", "order": 5, "duration_weeks": 2}
            ]
        },
        {
            "name": "Code Red Tracker",
            "description": "Critical incident management and escalation tracking system for real-time visibility into production issues and resolution status.",
            "owner": "Seth",
            "status": "active",
            "priority": "high",
            "start_date": "2024-11-01",
            "target_date": "2025-03-15",
            "phases": [
                {"name": "Requirements & Design", "order": 1, "duration_weeks": 3},
                {"name": "Core Development", "order": 2, "duration_weeks": 10},
                {"name": "Integration", "order": 3, "duration_weeks": 4},
                {"name": "Testing & Hardening", "order": 4, "duration_weeks": 3},
                {"name": "Production Release", "order": 5, "duration_weeks": 2}
            ]
        },
        {
            "name": "Change Management Transformation",
            "description": "Enterprise-wide change management platform transformation to improve change success rates and reduce deployment risks.",
            "owner": "Charlene",
            "status": "active",
            "priority": "high",
            "start_date": "2024-09-15",
            "target_date": "2025-04-30",
            "phases": [
                {"name": "Change Readiness Assessment", "order": 1, "duration_weeks": 4},
                {"name": "Process Design", "order": 2, "duration_weeks": 6},
                {"name": "Platform Implementation", "order": 3, "duration_weeks": 14},
                {"name": "Training & Adoption", "order": 4, "duration_weeks": 6},
                {"name": "Production Release", "order": 5, "duration_weeks": 2}
            ]
        }
    ]
    
    created_projects = []
    
    for proj_config in projects_config:
        project_id = f"proj_{uuid.uuid4().hex[:12]}"
        project = {
            "project_id": project_id,
            "name": proj_config["name"],
            "description": proj_config["description"],
            "status": proj_config["status"],
            "priority": proj_config["priority"],
            "start_date": proj_config["start_date"],
            "target_date": proj_config["target_date"],
            "created_by": user.user_id,
            "team_members": [user.user_id],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ai_generated": False,
            "phases": proj_config["phases"],
            "owner": proj_config["owner"]
        }
        await db.projects.insert_one(project)
        created_projects.append({"project_id": project_id, "name": proj_config["name"], "owner": proj_config["owner"]})
        
        # Create sprints for production release prep
        sprints = [
            {"name": "Sprint 1", "goal": "Core functionality complete", "status": "completed"},
            {"name": "Sprint 2", "goal": "Integration and data migration", "status": "completed"},
            {"name": "Sprint 3", "goal": "UAT and bug fixes", "status": "active"},
            {"name": "Sprint 4", "goal": "Production hardening and release prep", "status": "planning"}
        ]
        
        sprint_map = {}
        for i, sprint in enumerate(sprints):
            sprint_id = f"sprint_{uuid.uuid4().hex[:12]}"
            sprint_map[sprint["name"]] = sprint_id
            await db.sprints.insert_one({
                "sprint_id": sprint_id,
                "project_id": project_id,
                "name": sprint["name"],
                "goal": sprint["goal"],
                "status": sprint["status"],
                "start_date": f"2025-0{i+1}-01",
                "end_date": f"2025-0{i+1}-14",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Production Release Milestones
        milestones = [
            {"title": "Development Complete", "description": "All core features developed and code complete", "target_date": "2025-01-31", "health_status": "on_track", "completed": True},
            {"title": "UAT Sign-off", "description": "User acceptance testing completed with sign-off from business stakeholders", "target_date": "2025-02-15", "health_status": "on_track", "completed": False},
            {"title": "Performance Validation", "description": "Load testing and performance benchmarks met", "target_date": "2025-02-28", "health_status": "at_risk", "completed": False},
            {"title": "Security Audit Complete", "description": "Security review and penetration testing passed", "target_date": "2025-03-07", "health_status": "on_track", "completed": False},
            {"title": "Go-Live Readiness", "description": "All production checklists complete, runbooks approved", "target_date": "2025-03-14", "health_status": "on_track", "completed": False},
            {"title": "Production Release", "description": "Successful deployment to production environment", "target_date": proj_config["target_date"], "health_status": "on_track", "completed": False}
        ]
        
        for ms in milestones:
            await db.milestones.insert_one({
                "milestone_id": f"ms_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                **ms,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Production Release Stories
        stories = [
            {"title": "Complete production deployment runbook", "status": "in_progress", "story_points": 5, "sprint": "Sprint 3"},
            {"title": "Implement monitoring and alerting", "status": "in_progress", "story_points": 8, "sprint": "Sprint 3"},
            {"title": "Create rollback procedures", "status": "ready", "story_points": 5, "sprint": "Sprint 3"},
            {"title": "Document API endpoints for support team", "status": "in_progress", "story_points": 3, "sprint": "Sprint 3"},
            {"title": "Configure production environment variables", "status": "done", "story_points": 3, "sprint": "Sprint 3"},
            {"title": "Set up production database with DR", "status": "done", "story_points": 8, "sprint": "Sprint 2"},
            {"title": "Implement audit logging", "status": "done", "story_points": 5, "sprint": "Sprint 2"},
            {"title": "Complete load testing scenarios", "status": "in_progress", "story_points": 8, "sprint": "Sprint 3"},
            {"title": "Finalize user training materials", "status": "backlog", "story_points": 5, "sprint": "Sprint 4"},
            {"title": "Execute production smoke tests", "status": "backlog", "story_points": 3, "sprint": "Sprint 4"}
        ]
        
        for story in stories:
            await db.stories.insert_one({
                "story_id": f"story_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                "title": story["title"],
                "description": f"Production release preparation task",
                "status": story["status"],
                "story_points": story["story_points"],
                "priority": "high" if story["story_points"] >= 8 else "medium",
                "sprint_id": sprint_map.get(story["sprint"]),
                "assigned_to": proj_config["owner"],
                "acceptance_criteria": ["Completed and verified", "Documentation updated", "Peer reviewed"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Production Release Action Items
        action_items = [
            {"title": "Verify production credentials", "status": "done", "priority": "critical", "estimated_hours": 2, "assigned_to": "Seth"},
            {"title": "Schedule change advisory board review", "status": "done", "priority": "high", "estimated_hours": 4, "assigned_to": "Charlene"},
            {"title": "Prepare go-live communication", "status": "in_progress", "priority": "high", "estimated_hours": 8, "assigned_to": proj_config["owner"]},
            {"title": "Complete security checklist", "status": "in_progress", "priority": "critical", "estimated_hours": 6, "assigned_to": "Sandeep"},
            {"title": "Validate backup procedures", "status": "todo", "priority": "high", "estimated_hours": 4, "assigned_to": "Brian"},
            {"title": "Review release notes", "status": "todo", "priority": "medium", "estimated_hours": 3, "assigned_to": proj_config["owner"]},
            {"title": "Conduct dry-run deployment", "status": "todo", "priority": "critical", "estimated_hours": 8, "assigned_to": "Seth"},
            {"title": "Notify stakeholders of release window", "status": "todo", "priority": "high", "estimated_hours": 2, "assigned_to": "Paddy"}
        ]
        
        for task in action_items:
            await db.tasks.insert_one({
                "task_id": f"task_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                "title": task["title"],
                "description": f"Production release action item",
                "status": task["status"],
                "priority": task["priority"],
                "estimated_hours": task["estimated_hours"],
                "actual_hours": 0,
                "assigned_to": task["assigned_to"],
                "dependencies": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Production Release Risks
        risks = [
            {"description": "Production environment capacity may not handle peak load", "mitigation": "Conduct load testing at 150% expected capacity, have auto-scaling configured", "probability": "medium", "impact": "high", "status": "open"},
            {"description": "Third-party integration APIs may have downtime during release", "mitigation": "Coordinate with vendors on release schedule, implement circuit breakers", "probability": "low", "impact": "high", "status": "open"},
            {"description": "Data migration may cause temporary data inconsistencies", "mitigation": "Run migration in phases with validation checkpoints, prepare rollback scripts", "probability": "medium", "impact": "medium", "status": "mitigated"},
            {"description": "User adoption may be slower than expected", "mitigation": "Prepare comprehensive training, deploy in-app guidance, have support team ready", "probability": "medium", "impact": "medium", "status": "open"}
        ]
        
        for risk in risks:
            await db.risks.insert_one({
                "risk_id": f"risk_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                **risk,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # RAID Items - Risks, Issues, Action Items, Decisions
        raid_items = [
            # Risks
            {"type": "risk", "title": "Production capacity may not handle peak load", "description": "System may experience degraded performance during high-traffic periods", "owner": "Seth", "status": "open", "priority": "high", "due_date": "2025-02-28"},
            {"type": "risk", "title": "Third-party API dependency", "description": "External vendor API changes could impact functionality", "owner": "Brian", "status": "open", "priority": "medium"},
            {"type": "risk", "title": "Data migration data loss", "description": "Risk of data corruption during migration to new schema", "owner": "Seth", "status": "open", "priority": "critical", "due_date": "2025-03-01"},
            # Issues
            {"type": "issue", "title": "Performance testing environment not available", "description": "Need dedicated environment for load testing - blocking UAT completion", "owner": "Brian", "status": "open", "priority": "high", "due_date": "2025-02-20"},
            {"type": "issue", "title": "Security scan findings to resolve", "description": "3 medium-severity findings from security scan need remediation", "owner": "Sandeep", "status": "open", "priority": "high", "due_date": "2025-02-25"},
            {"type": "issue", "title": "API documentation gaps", "description": "Vendor API documentation incomplete, causing integration delays", "owner": proj_config["owner"], "status": "open", "priority": "medium"},
            # Action Items
            {"type": "action_item", "title": "Complete production runbook", "description": "Document all deployment and rollback procedures", "owner": "Seth", "status": "open", "priority": "high", "due_date": "2025-03-05"},
            {"type": "action_item", "title": "Schedule CAB review meeting", "description": "Book Change Advisory Board for release approval", "owner": "Charlene", "status": "closed", "priority": "high"},
            {"type": "action_item", "title": "Finalize training materials", "description": "Complete user guides and training videos", "owner": proj_config["owner"], "status": "open", "priority": "medium", "due_date": "2025-03-10"},
            {"type": "action_item", "title": "Notify stakeholders of go-live date", "description": "Send communications to all impacted stakeholders", "owner": "Paddy", "status": "open", "priority": "high", "due_date": "2025-03-07"},
            # Decisions
            {"type": "decision", "title": "Go-live date confirmed for March 15", "description": "Executive team approved production release date", "owner": "Paddy", "status": "closed", "priority": "critical"},
            {"type": "decision", "title": "Blue-green deployment strategy", "description": "Will use blue-green deployment for zero-downtime release", "owner": "Seth", "status": "closed", "priority": "high"},
            {"type": "decision", "title": "Rollback window set to 4 hours", "description": "Team agreed on 4-hour window for rollback decision", "owner": "Paddy", "status": "closed", "priority": "high"},
            {"type": "decision", "title": "Support escalation path defined", "description": "L1 > L2 > On-call engineer escalation approved", "owner": "Sandeep", "status": "closed", "priority": "medium"}
        ]
        
        for item in raid_items:
            await db.raid_items.insert_one({
                "raid_id": f"raid_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                **item,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Weekly Updates
        weekly_updates = [
            {
                "week_start": "2025-02-03",
                "whats_going_well": f"Core development complete. UAT feedback positive. Team velocity stable at 45 points/sprint.",
                "roadblocks": "Performance testing environment not yet available. Working with infrastructure team to expedite."
            },
            {
                "week_start": "2025-02-10",
                "whats_going_well": f"UAT 80% complete with no critical defects. Security scan passed. Runbooks drafted.",
                "roadblocks": "Two medium-priority bugs found in UAT requiring fixes. Estimated 3 days additional work."
            },
            {
                "week_start": "2025-02-17",
                "whats_going_well": f"All UAT bugs resolved. Load testing scheduled. Change request submitted to CAB.",
                "roadblocks": "Vendor API documentation outdated - working directly with vendor support to resolve."
            }
        ]
        
        for update in weekly_updates:
            await db.weekly_updates.insert_one({
                "update_id": f"update_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                "week_start": update["week_start"],
                "whats_going_well": update["whats_going_well"],
                "roadblocks": update["roadblocks"],
                "created_by": user.user_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Change Requests for Production Release
        change_requests = [
            {
                "title": f"{proj_config['name']} - Production Release v1.0",
                "description": f"Initial production deployment of {proj_config['name']} including all core functionality",
                "change_type": "feature",
                "impact": "high",
                "risk_level": "medium",
                "status": "pending_review",
                "target_date": proj_config["target_date"],
                "rollback_plan": "Automated rollback script to previous version, database restore from pre-release backup"
            },
            {
                "title": f"Database schema migration for {proj_config['name']}",
                "description": "Production database schema changes required for v1.0 release",
                "change_type": "infrastructure",
                "impact": "high",
                "risk_level": "medium",
                "status": "approved",
                "target_date": proj_config["target_date"],
                "rollback_plan": "Reverse migration scripts tested and ready, point-in-time recovery enabled"
            }
        ]
        
        for cr in change_requests:
            await db.change_requests.insert_one({
                "change_id": f"cr_{uuid.uuid4().hex[:12]}",
                "project_id": project_id,
                "title": cr["title"],
                "description": cr["description"],
                "change_type": cr["change_type"],
                "impact": cr["impact"],
                "risk_level": cr["risk_level"],
                "status": cr["status"],
                "target_date": cr["target_date"],
                "rollback_plan": cr["rollback_plan"],
                "requested_by": user.user_id,
                "approved_by": user.user_id if cr["status"] == "approved" else None,
                "implementation_date": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    
    return {
        "message": "Demo data seeded successfully",
        "team_members": len(team_members),
        "projects": len(created_projects),
        "projects_created": [p["name"] for p in created_projects]
    }

# ================== SETUP ==================

@api_router.get("/")
async def root():
    return {"message": "CompassX API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
