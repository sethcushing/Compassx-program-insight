"""
CRUD Tests for CompassX API
Tests all entity operations: Projects, Tasks, Stories, Sprints, Milestones, Risks, Resources
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from datetime import datetime, timezone
import uuid
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import app, db

# Test user data - unique per test run
TEST_USER_ID = f"test_user_{uuid.uuid4().hex[:8]}"
TEST_TOKEN = f"test_token_{uuid.uuid4().hex}"

# Configure pytest-asyncio
pytestmark = pytest.mark.asyncio

@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for all tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

async def setup_test_data():
    """Setup test user and session in database"""
    test_user = {
        "user_id": TEST_USER_ID,
        "email": "test@compassx.com",
        "name": "Test User",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    test_session = {
        "session_id": str(uuid.uuid4()),
        "user_id": TEST_USER_ID,
        "session_token": TEST_TOKEN,
        "expires_at": "2030-01-01T00:00:00+00:00",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.delete_many({"user_id": TEST_USER_ID})
    await db.user_sessions.delete_many({"user_id": TEST_USER_ID})
    await db.users.insert_one(test_user)
    await db.user_sessions.insert_one(test_session)

async def cleanup_test_data():
    """Cleanup test data"""
    await db.users.delete_many({"user_id": TEST_USER_ID})
    await db.user_sessions.delete_many({"user_id": TEST_USER_ID})

@pytest_asyncio.fixture(scope="module")
async def authenticated_client():
    """Create async HTTP client with auth - reused across tests"""
    await setup_test_data()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ac.cookies.set("session_token", TEST_TOKEN)
        yield ac
    await cleanup_test_data()


# ============ PROJECT TESTS ============

async def test_create_project(authenticated_client):
    """Test creating a project"""
    response = await authenticated_client.post("/api/projects", json={
        "name": "Test Project",
        "description": "Test Description",
        "priority": "high"
    })
    assert response.status_code == 200, f"Failed: {response.json()}"
    data = response.json()
    assert data["name"] == "Test Project"
    assert "project_id" in data
    # Cleanup
    await db.projects.delete_one({"project_id": data["project_id"]})


async def test_get_projects(authenticated_client):
    """Test getting all projects"""
    response = await authenticated_client.get("/api/projects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_update_project(authenticated_client):
    """Test updating a project"""
    # Create project first
    create_resp = await authenticated_client.post("/api/projects", json={
        "name": "Update Test",
        "description": "Before update"
    })
    project_id = create_resp.json()["project_id"]
    
    # Update it
    update_resp = await authenticated_client.patch(f"/api/projects/{project_id}", json={
        "name": "Updated Name"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Name"
    
    # Cleanup
    await db.projects.delete_one({"project_id": project_id})


async def test_delete_project(authenticated_client):
    """Test deleting a project"""
    # Create project
    create_resp = await authenticated_client.post("/api/projects", json={
        "name": "Delete Test",
        "description": "Will be deleted"
    })
    project_id = create_resp.json()["project_id"]
    
    # Delete it
    delete_resp = await authenticated_client.delete(f"/api/projects/{project_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["message"] == "Project deleted"
    
    # Verify deleted
    get_resp = await authenticated_client.get(f"/api/projects/{project_id}")
    assert get_resp.status_code == 404


# ============ TASK TESTS ============

async def test_task_crud(authenticated_client):
    """Test task CRUD operations"""
    # Create project first
    proj = await authenticated_client.post("/api/projects", json={"name": "Task Test Project", "description": "For tasks"})
    project_id = proj.json()["project_id"]
    
    # Create task
    task_resp = await authenticated_client.post("/api/tasks", json={
        "project_id": project_id,
        "title": "Test Task",
        "description": "Task description",
        "priority": "high"
    })
    assert task_resp.status_code == 200
    task_id = task_resp.json()["task_id"]
    
    # Get tasks
    get_resp = await authenticated_client.get(f"/api/tasks?project_id={project_id}")
    assert get_resp.status_code == 200
    assert len(get_resp.json()) >= 1
    
    # Update task
    update_resp = await authenticated_client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"})
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"
    
    # Delete task
    delete_resp = await authenticated_client.delete(f"/api/tasks/{task_id}")
    assert delete_resp.status_code == 200
    
    # Cleanup
    await db.projects.delete_one({"project_id": project_id})


# ============ STORY TESTS ============

async def test_story_crud(authenticated_client):
    """Test story CRUD operations"""
    # Create project
    proj = await authenticated_client.post("/api/projects", json={"name": "Story Test", "description": "For stories"})
    project_id = proj.json()["project_id"]
    
    # Create story
    story_resp = await authenticated_client.post("/api/stories", json={
        "project_id": project_id,
        "title": "As a user, I want to test",
        "description": "Test story",
        "story_points": 5,
        "priority": "high"
    })
    assert story_resp.status_code == 200
    story_id = story_resp.json()["story_id"]
    assert story_resp.json()["story_points"] == 5
    
    # Get stories
    get_resp = await authenticated_client.get(f"/api/stories?project_id={project_id}")
    assert get_resp.status_code == 200
    
    # Update story
    update_resp = await authenticated_client.patch(f"/api/stories/{story_id}", json={"status": "in_progress"})
    assert update_resp.status_code == 200
    
    # Delete story
    delete_resp = await authenticated_client.delete(f"/api/stories/{story_id}")
    assert delete_resp.status_code == 200
    
    # Cleanup
    await db.projects.delete_one({"project_id": project_id})


# ============ SPRINT TESTS ============

async def test_sprint_crud(authenticated_client):
    """Test sprint CRUD operations"""
    # Create project
    proj = await authenticated_client.post("/api/projects", json={"name": "Sprint Test", "description": "For sprints"})
    project_id = proj.json()["project_id"]
    
    # Create sprint
    sprint_resp = await authenticated_client.post("/api/sprints", json={
        "project_id": project_id,
        "name": "Sprint 1",
        "goal": "Complete testing"
    })
    assert sprint_resp.status_code == 200
    sprint_id = sprint_resp.json()["sprint_id"]
    
    # Get sprints
    get_resp = await authenticated_client.get(f"/api/sprints?project_id={project_id}")
    assert get_resp.status_code == 200
    
    # Update sprint
    update_resp = await authenticated_client.patch(f"/api/sprints/{sprint_id}", json={"status": "active"})
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "active"
    
    # Delete sprint
    delete_resp = await authenticated_client.delete(f"/api/sprints/{sprint_id}")
    assert delete_resp.status_code == 200
    
    # Cleanup
    await db.projects.delete_one({"project_id": project_id})


# ============ MILESTONE TESTS ============

async def test_milestone_crud(authenticated_client):
    """Test milestone CRUD operations"""
    # Create project
    proj = await authenticated_client.post("/api/projects", json={"name": "Milestone Test", "description": "For milestones"})
    project_id = proj.json()["project_id"]
    
    # Create milestone
    ms_resp = await authenticated_client.post("/api/milestones", json={
        "project_id": project_id,
        "title": "Phase 1 Complete",
        "target_date": "2025-06-30"
    })
    assert ms_resp.status_code == 200
    milestone_id = ms_resp.json()["milestone_id"]
    
    # Get milestones
    get_resp = await authenticated_client.get(f"/api/milestones?project_id={project_id}")
    assert get_resp.status_code == 200
    
    # Update milestone
    update_resp = await authenticated_client.patch(f"/api/milestones/{milestone_id}", json={"health_status": "at_risk"})
    assert update_resp.status_code == 200
    
    # Delete milestone
    delete_resp = await authenticated_client.delete(f"/api/milestones/{milestone_id}")
    assert delete_resp.status_code == 200
    
    # Cleanup
    await db.projects.delete_one({"project_id": project_id})


# ============ RISK TESTS ============

async def test_risk_crud(authenticated_client):
    """Test risk CRUD operations"""
    # Create project
    proj = await authenticated_client.post("/api/projects", json={"name": "Risk Test", "description": "For risks"})
    project_id = proj.json()["project_id"]
    
    # Create risk
    risk_resp = await authenticated_client.post("/api/risks", json={
        "project_id": project_id,
        "description": "Resource availability risk",
        "probability": "high",
        "impact": "high"
    })
    assert risk_resp.status_code == 200
    risk_id = risk_resp.json()["risk_id"]
    
    # Get risks
    get_resp = await authenticated_client.get(f"/api/risks?project_id={project_id}")
    assert get_resp.status_code == 200
    
    # Update risk
    update_resp = await authenticated_client.patch(f"/api/risks/{risk_id}", json={"status": "mitigated"})
    assert update_resp.status_code == 200
    
    # Delete risk
    delete_resp = await authenticated_client.delete(f"/api/risks/{risk_id}")
    assert delete_resp.status_code == 200
    
    # Cleanup
    await db.projects.delete_one({"project_id": project_id})


# ============ RESOURCE TESTS ============

async def test_resource_crud(authenticated_client):
    """Test resource CRUD operations"""
    # Create resource
    res_resp = await authenticated_client.post("/api/resources", json={
        "name": "Test Engineer",
        "email": f"engineer_{uuid.uuid4().hex[:6]}@compassx.com",
        "role": "Developer",
        "skills": ["Python", "React"]
    })
    assert res_resp.status_code == 200
    resource_id = res_resp.json()["resource_id"]
    
    # Get resources
    get_resp = await authenticated_client.get("/api/resources")
    assert get_resp.status_code == 200
    
    # Cleanup
    await db.resources.delete_one({"resource_id": resource_id})


# ============ DASHBOARD STATS TEST ============

async def test_dashboard_stats(authenticated_client):
    """Test dashboard stats endpoint"""
    response = await authenticated_client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert "tasks" in data
    assert "stories" in data
    assert "story_points_data" in data


# ============ STORY-SPRINT ASSIGNMENT TEST ============

async def test_story_sprint_assignment(authenticated_client):
    """Test assigning stories to sprints"""
    # Create project
    proj = await authenticated_client.post("/api/projects", json={"name": "Assignment Test", "description": "Test"})
    project_id = proj.json()["project_id"]
    
    # Create sprint
    sprint = await authenticated_client.post("/api/sprints", json={
        "project_id": project_id,
        "name": "Sprint 1"
    })
    sprint_id = sprint.json()["sprint_id"]
    
    # Create story
    story = await authenticated_client.post("/api/stories", json={
        "project_id": project_id,
        "title": "Test Story",
        "story_points": 3
    })
    story_id = story.json()["story_id"]
    
    # Assign story to sprint
    update_resp = await authenticated_client.patch(f"/api/stories/{story_id}", json={"sprint_id": sprint_id})
    assert update_resp.status_code == 200
    assert update_resp.json()["sprint_id"] == sprint_id
    
    # Cleanup
    await db.stories.delete_one({"story_id": story_id})
    await db.sprints.delete_one({"sprint_id": sprint_id})
    await db.projects.delete_one({"project_id": project_id})


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
