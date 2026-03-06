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
    status: str = "backlog"  # backlog, ready, in_progress, done
    priority: str = "medium"
    story_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoryCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    epic: Optional[str] = None
    priority: str = "medium"
    story_points: int = 0

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

# ================== AUTH HELPERS ==================

async def get_current_user(request: Request) -> User:
    # Try cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

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
    
    project["tasks"] = tasks
    project["milestones"] = milestones
    project["stories"] = stories
    
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
        story_points=story.story_points
    )
    
    doc = new_story.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.stories.insert_one(doc)
    
    return {**doc, "_id": None}

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
    
    # Milestones
    all_milestones = await db.milestones.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(200)
    milestones_by_health = {
        "on_track": len([m for m in all_milestones if m["health_status"] == "on_track"]),
        "at_risk": len([m for m in all_milestones if m["health_status"] == "at_risk"]),
        "delayed": len([m for m in all_milestones if m["health_status"] == "delayed"])
    }
    
    # Resources
    resources = await db.resources.find({}, {"_id": 0}).to_list(100)
    
    # Calculate velocity (tasks done per week - simulated)
    velocity_data = [
        {"week": "W1", "planned": 12, "completed": 10},
        {"week": "W2", "planned": 15, "completed": 14},
        {"week": "W3", "planned": 14, "completed": 16},
        {"week": "W4", "planned": 18, "completed": 15},
        {"week": "W5", "planned": 16, "completed": 17},
        {"week": "W6", "planned": 20, "completed": 18}
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
        "milestones": milestones_by_health,
        "resources": {
            "total": len(resources),
            "available": len([r for r in resources if r["availability"] > 50])
        },
        "velocity_data": velocity_data,
        "burndown_data": burndown_data,
        "total_story_points": sum([s.get("story_points", 0) for s in await db.stories.find({"project_id": {"$in": project_ids}}, {"_id": 0}).to_list(500)])
    }

# ================== SEED DATA ==================

@api_router.post("/seed-demo-data")
async def seed_demo_data(user: User = Depends(get_current_user)):
    """Seed demo data for the platform"""
    
    # Demo Projects
    demo_projects = [
        {
            "project_id": f"proj_demo_{uuid.uuid4().hex[:8]}",
            "name": "Mobile App Launch",
            "description": "Launch a new mobile banking application with AI-powered financial insights and seamless user experience.",
            "status": "active",
            "priority": "high",
            "start_date": "2025-01-15",
            "target_date": "2025-06-30",
            "created_by": user.user_id,
            "team_members": [user.user_id],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ai_generated": False,
            "phases": [
                {"name": "Discovery", "order": 1, "duration_weeks": 3},
                {"name": "Design", "order": 2, "duration_weeks": 4},
                {"name": "Development", "order": 3, "duration_weeks": 12},
                {"name": "Testing", "order": 4, "duration_weeks": 4},
                {"name": "Launch", "order": 5, "duration_weeks": 2}
            ]
        },
        {
            "project_id": f"proj_demo_{uuid.uuid4().hex[:8]}",
            "name": "Data Platform Modernization",
            "description": "Migrate legacy data warehouse to a modern cloud-native data platform with real-time analytics capabilities.",
            "status": "active",
            "priority": "high",
            "start_date": "2025-02-01",
            "target_date": "2025-09-30",
            "created_by": user.user_id,
            "team_members": [user.user_id],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ai_generated": False,
            "phases": [
                {"name": "Assessment", "order": 1, "duration_weeks": 4},
                {"name": "Architecture", "order": 2, "duration_weeks": 6},
                {"name": "Migration", "order": 3, "duration_weeks": 16},
                {"name": "Validation", "order": 4, "duration_weeks": 4},
                {"name": "Cutover", "order": 5, "duration_weeks": 2}
            ]
        },
        {
            "project_id": f"proj_demo_{uuid.uuid4().hex[:8]}",
            "name": "AI Chatbot Deployment",
            "description": "Deploy an enterprise AI chatbot for customer support with multi-language support and sentiment analysis.",
            "status": "planning",
            "priority": "medium",
            "start_date": "2025-03-01",
            "target_date": "2025-07-31",
            "created_by": user.user_id,
            "team_members": [user.user_id],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ai_generated": False,
            "phases": [
                {"name": "Requirements", "order": 1, "duration_weeks": 2},
                {"name": "Model Training", "order": 2, "duration_weeks": 8},
                {"name": "Integration", "order": 3, "duration_weeks": 6},
                {"name": "Pilot", "order": 4, "duration_weeks": 4},
                {"name": "Rollout", "order": 5, "duration_weeks": 2}
            ]
        }
    ]
    
    for project in demo_projects:
        await db.projects.update_one(
            {"name": project["name"], "created_by": user.user_id},
            {"$set": project},
            upsert=True
        )
        
        # Add milestones for each project
        milestones = [
            {"title": f"Phase 1 Complete", "description": "First phase deliverables", "target_date": "2025-02-15", "health_status": "on_track"},
            {"title": f"MVP Ready", "description": "Minimum viable product complete", "target_date": "2025-04-30", "health_status": "on_track"},
            {"title": f"Beta Launch", "description": "Beta release to selected users", "target_date": "2025-05-31", "health_status": "at_risk"},
            {"title": f"Production Release", "description": "Full production deployment", "target_date": "2025-06-30", "health_status": "on_track"}
        ]
        
        for ms in milestones:
            ms_doc = {
                "milestone_id": f"ms_{uuid.uuid4().hex[:12]}",
                "project_id": project["project_id"],
                **ms,
                "completed": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.milestones.update_one(
                {"project_id": project["project_id"], "title": ms["title"]},
                {"$set": ms_doc},
                upsert=True
            )
        
        # Add tasks
        task_templates = [
            {"title": "Requirements gathering", "status": "done", "priority": "high", "estimated_hours": 16},
            {"title": "Technical design document", "status": "done", "priority": "high", "estimated_hours": 24},
            {"title": "Setup development environment", "status": "done", "priority": "medium", "estimated_hours": 8},
            {"title": "Core API development", "status": "in_progress", "priority": "high", "estimated_hours": 40},
            {"title": "Database schema design", "status": "done", "priority": "high", "estimated_hours": 12},
            {"title": "Authentication module", "status": "in_progress", "priority": "high", "estimated_hours": 20},
            {"title": "UI component library", "status": "in_progress", "priority": "medium", "estimated_hours": 32},
            {"title": "Integration testing", "status": "todo", "priority": "high", "estimated_hours": 24},
            {"title": "Performance optimization", "status": "todo", "priority": "medium", "estimated_hours": 16},
            {"title": "Security audit", "status": "todo", "priority": "high", "estimated_hours": 20},
            {"title": "Documentation", "status": "todo", "priority": "low", "estimated_hours": 12},
            {"title": "User training materials", "status": "todo", "priority": "low", "estimated_hours": 8}
        ]
        
        for task in task_templates:
            task_doc = {
                "task_id": f"task_{uuid.uuid4().hex[:12]}",
                "project_id": project["project_id"],
                "description": f"Complete {task['title'].lower()} for the project",
                "actual_hours": 0,
                "dependencies": [],
                "sprint": "Sprint 1" if task["status"] in ["done", "in_progress"] else "Sprint 2",
                "created_at": datetime.now(timezone.utc).isoformat(),
                **task
            }
            await db.tasks.update_one(
                {"project_id": project["project_id"], "title": task["title"]},
                {"$set": task_doc},
                upsert=True
            )
    
    # Demo Resources
    demo_resources = [
        {"name": "Sarah Chen", "email": "sarah.chen@compassx.com", "role": "Project Manager", "skills": ["Agile", "Scrum", "Stakeholder Management"], "availability": 100, "avatar": "https://images.unsplash.com/photo-1758518731468-98e90ffd7430?w=100"},
        {"name": "Marcus Johnson", "email": "marcus.j@compassx.com", "role": "Tech Lead", "skills": ["Python", "AWS", "System Design"], "availability": 80, "avatar": "https://images.unsplash.com/photo-1758518730523-c9f6336ebdae?w=100"},
        {"name": "Emily Rodriguez", "email": "emily.r@compassx.com", "role": "Senior Developer", "skills": ["React", "Node.js", "TypeScript"], "availability": 100, "avatar": "https://images.unsplash.com/photo-1763550662603-78aa2f2033bf?w=100"},
        {"name": "David Kim", "email": "david.kim@compassx.com", "role": "Data Engineer", "skills": ["Spark", "Python", "SQL"], "availability": 60, "avatar": None},
        {"name": "Lisa Wang", "email": "lisa.w@compassx.com", "role": "UX Designer", "skills": ["Figma", "User Research", "Prototyping"], "availability": 100, "avatar": None},
        {"name": "James Miller", "email": "james.m@compassx.com", "role": "QA Engineer", "skills": ["Selenium", "API Testing", "Performance Testing"], "availability": 90, "avatar": None}
    ]
    
    for resource in demo_resources:
        res_doc = {
            "resource_id": f"res_{uuid.uuid4().hex[:12]}",
            "pto_days": [],
            "user_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **resource
        }
        await db.resources.update_one(
            {"email": resource["email"]},
            {"$set": res_doc},
            upsert=True
        )
    
    return {"message": "Demo data seeded successfully", "projects": len(demo_projects), "resources": len(demo_resources)}

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
