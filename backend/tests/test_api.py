import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://project-copilot-ai-1.preview.emergentagent.com')
SESSION_TOKEN = "test_session_1772823453557"
AUTH_HEADERS = {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}


class TestRootAndAuth:
    """Test root endpoint and authentication"""

    def test_root_endpoint_returns_200(self):
        """API root endpoint should return 200"""
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert "message" in data

    def test_protected_route_returns_401_without_auth(self):
        """Protected routes should return 401 when unauthenticated"""
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_projects_returns_401_without_auth(self):
        """GET /projects returns 401 without auth"""
        r = requests.get(f"{BASE_URL}/api/projects")
        assert r.status_code == 401

    def test_auth_me_returns_user_with_valid_token(self):
        """GET /auth/me returns user data for authenticated user"""
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert data["email"].endswith("@compassx.com")

    def test_auth_me_returns_401_with_invalid_token(self):
        """GET /auth/me returns 401 with invalid token"""
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer invalid_token"})
        assert r.status_code == 401


class TestProjectsCRUD:
    """Test Project CRUD operations"""
    created_project_ids = []

    def test_get_projects_authenticated(self):
        """GET /projects returns list for authenticated user"""
        r = requests.get(f"{BASE_URL}/api/projects", headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_project(self):
        """POST /projects creates a new project"""
        ts = int(time.time())
        payload = {
            "name": f"TEST_Project_{ts}",
            "description": "Test project description",
            "priority": "medium"
        }
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "project_id" in data
        assert data["name"] == payload["name"]
        TestProjectsCRUD.created_project_ids.append(data["project_id"])

    def test_get_project_by_id(self):
        """GET /projects/{id} returns project details"""
        # Create a project first
        ts = int(time.time())
        payload = {"name": f"TEST_Project_Get_{ts}", "description": "Test", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        project_id = r.json()["project_id"]
        TestProjectsCRUD.created_project_ids.append(project_id)

        # Get by ID
        r = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert data["project_id"] == project_id
        assert "tasks" in data
        assert "milestones" in data

    def test_delete_project(self):
        """DELETE /projects/{id} removes project"""
        # Create a project
        ts = int(time.time())
        payload = {"name": f"TEST_Project_Del_{ts}", "description": "Delete me", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        project_id = r.json()["project_id"]

        # Delete it
        r = requests.delete(f"{BASE_URL}/api/projects/{project_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200

        # Verify it's gone
        r = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=AUTH_HEADERS)
        assert r.status_code == 404

    def test_cleanup_created_projects(self):
        """Cleanup projects created in tests"""
        for pid in TestProjectsCRUD.created_project_ids:
            requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=AUTH_HEADERS)


class TestTasksCRUD:
    """Test Tasks CRUD"""

    def setup_method(self):
        """Create a test project for tasks"""
        ts = int(time.time())
        payload = {"name": f"TEST_TaskProject_{ts}", "description": "Task test", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        self.project_id = r.json()["project_id"]
        self.created_task_ids = []

    def teardown_method(self):
        """Delete test project and tasks"""
        for tid in self.created_task_ids:
            requests.delete(f"{BASE_URL}/api/tasks/{tid}", headers=AUTH_HEADERS)
        requests.delete(f"{BASE_URL}/api/projects/{self.project_id}", headers=AUTH_HEADERS)

    def test_create_task(self):
        """POST /tasks creates a new task"""
        ts = int(time.time())
        payload = {
            "project_id": self.project_id,
            "title": f"TEST_Task_{ts}",
            "description": "Test task",
            "priority": "high",
            "estimated_hours": 4
        }
        r = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "task_id" in data
        assert data["title"] == payload["title"]
        self.created_task_ids.append(data["task_id"])

    def test_get_tasks_by_project(self):
        """GET /tasks?project_id= filters by project"""
        # Create task
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Task_Filter_{ts}", "description": ""}
        r = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        task_id = r.json()["task_id"]
        self.created_task_ids.append(task_id)

        # Get filtered tasks
        r = requests.get(f"{BASE_URL}/api/tasks?project_id={self.project_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200
        tasks = r.json()
        assert any(t["task_id"] == task_id for t in tasks)

    def test_update_task_status(self):
        """PATCH /tasks/{id} updates task fields"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Task_Update_{ts}", "description": ""}
        r = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        task_id = r.json()["task_id"]
        self.created_task_ids.append(task_id)

        # Update
        r = requests.patch(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "in_progress"}, headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"

    def test_delete_task(self):
        """DELETE /tasks/{id} removes the task"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Task_Del_{ts}", "description": ""}
        r = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        task_id = r.json()["task_id"]

        r = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200


class TestMilestonesCRUD:
    """Test Milestones CRUD"""

    def setup_method(self):
        ts = int(time.time())
        payload = {"name": f"TEST_MsProject_{ts}", "description": "Milestone test", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        self.project_id = r.json()["project_id"]
        self.created_milestone_ids = []

    def teardown_method(self):
        requests.delete(f"{BASE_URL}/api/projects/{self.project_id}", headers=AUTH_HEADERS)

    def test_create_milestone(self):
        """POST /milestones creates a new milestone"""
        ts = int(time.time())
        payload = {
            "project_id": self.project_id,
            "title": f"TEST_Milestone_{ts}",
            "description": "Test milestone",
            "target_date": "2026-12-31"
        }
        r = requests.post(f"{BASE_URL}/api/milestones", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "milestone_id" in data
        assert data["title"] == payload["title"]
        self.created_milestone_ids.append(data["milestone_id"])

    def test_update_milestone(self):
        """PATCH /milestones/{id} updates milestone fields"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Ms_Update_{ts}", "target_date": "2026-06-01"}
        r = requests.post(f"{BASE_URL}/api/milestones", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        milestone_id = r.json()["milestone_id"]
        self.created_milestone_ids.append(milestone_id)

        r = requests.patch(f"{BASE_URL}/api/milestones/{milestone_id}", json={"health_status": "at_risk"}, headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert r.json()["health_status"] == "at_risk"

    def test_delete_milestone(self):
        """DELETE /milestones/{id} removes the milestone"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Ms_Del_{ts}", "target_date": "2026-06-01"}
        r = requests.post(f"{BASE_URL}/api/milestones", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        milestone_id = r.json()["milestone_id"]

        r = requests.delete(f"{BASE_URL}/api/milestones/{milestone_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200

        # Verify gone
        r = requests.get(f"{BASE_URL}/api/milestones?project_id={self.project_id}", headers=AUTH_HEADERS)
        assert all(m["milestone_id"] != milestone_id for m in r.json())


class TestStoriesCRUD:
    """Test Stories CRUD"""

    def setup_method(self):
        ts = int(time.time())
        payload = {"name": f"TEST_StoryProject_{ts}", "description": "Story test", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        self.project_id = r.json()["project_id"]
        self.created_story_ids = []

    def teardown_method(self):
        requests.delete(f"{BASE_URL}/api/projects/{self.project_id}", headers=AUTH_HEADERS)

    def test_create_story_with_acceptance_criteria(self):
        """POST /stories creates story with acceptance criteria"""
        ts = int(time.time())
        payload = {
            "project_id": self.project_id,
            "title": f"TEST_Story_{ts}",
            "description": "As a user, I want...",
            "priority": "high",
            "story_points": 5,
            "acceptance_criteria": ["Given X, when Y, then Z", "User can see the feature"]
        }
        r = requests.post(f"{BASE_URL}/api/stories", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "story_id" in data
        assert data["title"] == payload["title"]
        assert len(data["acceptance_criteria"]) == 2
        self.created_story_ids.append(data["story_id"])

    def test_update_story(self):
        """PATCH /stories/{id} updates story"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Story_Update_{ts}", "acceptance_criteria": []}
        r = requests.post(f"{BASE_URL}/api/stories", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        story_id = r.json()["story_id"]
        self.created_story_ids.append(story_id)

        r = requests.patch(f"{BASE_URL}/api/stories/{story_id}", json={"status": "in_progress", "story_points": 8}, headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"

    def test_delete_story(self):
        """DELETE /stories/{id} removes the story"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "title": f"TEST_Story_Del_{ts}", "acceptance_criteria": []}
        r = requests.post(f"{BASE_URL}/api/stories", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        story_id = r.json()["story_id"]

        r = requests.delete(f"{BASE_URL}/api/stories/{story_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200

        # Verify gone via list
        r = requests.get(f"{BASE_URL}/api/stories?project_id={self.project_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert all(s["story_id"] != story_id for s in r.json())


class TestRisksCRUD:
    """Test Risks CRUD"""

    def setup_method(self):
        ts = int(time.time())
        payload = {"name": f"TEST_RiskProject_{ts}", "description": "Risk test", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        self.project_id = r.json()["project_id"]

    def teardown_method(self):
        requests.delete(f"{BASE_URL}/api/projects/{self.project_id}", headers=AUTH_HEADERS)

    def test_create_risk(self):
        """POST /risks creates a new risk"""
        ts = int(time.time())
        payload = {
            "project_id": self.project_id,
            "description": f"TEST_Risk_{ts}: potential delay",
            "mitigation": "Add buffer time",
            "probability": "high",
            "impact": "medium"
        }
        r = requests.post(f"{BASE_URL}/api/risks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "risk_id" in data
        assert data["probability"] == "high"
        assert data["impact"] == "medium"

    def test_update_risk(self):
        """PATCH /risks/{id} updates risk status"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "description": f"TEST_Risk_Update_{ts}"}
        r = requests.post(f"{BASE_URL}/api/risks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        risk_id = r.json()["risk_id"]

        r = requests.patch(f"{BASE_URL}/api/risks/{risk_id}", json={"status": "mitigated"}, headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert r.json()["status"] == "mitigated"

    def test_delete_risk(self):
        """DELETE /risks/{id} removes the risk"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "description": f"TEST_Risk_Del_{ts}"}
        r = requests.post(f"{BASE_URL}/api/risks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        risk_id = r.json()["risk_id"]

        r = requests.delete(f"{BASE_URL}/api/risks/{risk_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200

    def test_get_risks_by_project(self):
        """GET /risks?project_id= filters by project"""
        ts = int(time.time())
        payload = {"project_id": self.project_id, "description": f"TEST_Risk_Filter_{ts}"}
        r = requests.post(f"{BASE_URL}/api/risks", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        risk_id = r.json()["risk_id"]

        r = requests.get(f"{BASE_URL}/api/risks?project_id={self.project_id}", headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert any(r_item["risk_id"] == risk_id for r_item in r.json())


class TestProjectUpdate:
    """Test Project PATCH endpoint"""

    def setup_method(self):
        ts = int(time.time())
        payload = {"name": f"TEST_PatchProject_{ts}", "description": "Patch test", "priority": "low"}
        r = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=AUTH_HEADERS)
        assert r.status_code == 200
        self.project_id = r.json()["project_id"]

    def teardown_method(self):
        requests.delete(f"{BASE_URL}/api/projects/{self.project_id}", headers=AUTH_HEADERS)

    def test_update_project_status(self):
        """PATCH /projects/{id} updates project status"""
        r = requests.patch(f"{BASE_URL}/api/projects/{self.project_id}", json={"status": "active"}, headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert r.json()["status"] == "active"

    def test_update_project_name(self):
        """PATCH /projects/{id} updates project name"""
        ts = int(time.time())
        new_name = f"TEST_Updated_Name_{ts}"
        r = requests.patch(f"{BASE_URL}/api/projects/{self.project_id}", json={"name": new_name}, headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert r.json()["name"] == new_name


class TestSeedAndDashboard:
    """Test seed data and dashboard stats"""

    def test_dashboard_stats_authenticated(self):
        """GET /dashboard/stats returns stats for authenticated user"""
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "projects" in data
        assert "tasks" in data
        assert "resources" in data
        assert "velocity_data" in data

    def test_seed_demo_data(self):
        """POST /seed-demo-data returns success"""
        r = requests.post(f"{BASE_URL}/api/seed-demo-data", headers=AUTH_HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "message" in data
        assert "projects" in data

    def test_resources_list(self):
        """GET /resources returns list"""
        r = requests.get(f"{BASE_URL}/api/resources", headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_milestones_list(self):
        """GET /milestones returns list"""
        r = requests.get(f"{BASE_URL}/api/milestones", headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_stories_list(self):
        """GET /stories returns list"""
        r = requests.get(f"{BASE_URL}/api/stories", headers=AUTH_HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
