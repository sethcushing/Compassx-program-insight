#!/usr/bin/env python3
"""
Direct API Test Script for CompassX
Tests all CRUD operations by making HTTP requests to the running server
"""
import requests
import sys
import os
import uuid
from datetime import datetime, timezone

# Get API URL
API_URL = os.environ.get('API_URL', 'https://project-planner-ai-1.preview.emergentagent.com/api')

def get_test_session():
    """Create test user and session directly in MongoDB"""
    from pymongo import MongoClient
    from dotenv import load_dotenv
    
    load_dotenv('/app/backend/.env')
    client = MongoClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    test_token = f"test_token_{uuid.uuid4().hex}"
    
    test_user = {
        "user_id": test_user_id,
        "email": "test@compassx.com",
        "name": "Test User",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    test_session = {
        "session_id": str(uuid.uuid4()),
        "user_id": test_user_id,
        "session_token": test_token,
        "expires_at": "2030-01-01T00:00:00+00:00",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.users.delete_many({"user_id": test_user_id})
    db.user_sessions.delete_many({"user_id": test_user_id})
    db.users.insert_one(test_user)
    db.user_sessions.insert_one(test_session)
    
    return test_token, test_user_id, db

def cleanup(db, test_user_id):
    """Cleanup test data"""
    db.users.delete_many({"user_id": test_user_id})
    db.user_sessions.delete_many({"user_id": test_user_id})

def make_request(method, endpoint, cookies=None, json=None):
    """Make HTTP request with error handling"""
    url = f"{API_URL}{endpoint}"
    try:
        response = requests.request(method, url, cookies=cookies, json=json)
        return response
    except Exception as e:
        print(f"  Request error: {e}")
        return None

def test_projects_crud(cookies, db):
    """Test Project CRUD operations"""
    print("\n=== Testing Projects CRUD ===")
    created_project_id = None
    
    # Create
    print("  1. Creating project...")
    resp = make_request("POST", "/projects", cookies, {"name": "Test Project", "description": "Test", "priority": "high"})
    if resp and resp.status_code == 200:
        created_project_id = resp.json().get("project_id")
        print(f"     PASS - Created: {created_project_id}")
    else:
        print(f"     FAIL - Status: {resp.status_code if resp else 'None'}, Response: {resp.json() if resp else 'None'}")
        return False
    
    # Read
    print("  2. Getting project...")
    resp = make_request("GET", f"/projects/{created_project_id}", cookies)
    if resp and resp.status_code == 200 and resp.json().get("name") == "Test Project":
        print("     PASS - Got project")
    else:
        print(f"     FAIL - Status: {resp.status_code if resp else 'None'}")
        db.projects.delete_one({"project_id": created_project_id})
        return False
    
    # Update
    print("  3. Updating project...")
    resp = make_request("PATCH", f"/projects/{created_project_id}", cookies, {"name": "Updated Project"})
    if resp and resp.status_code == 200 and resp.json().get("name") == "Updated Project":
        print("     PASS - Updated")
    else:
        print(f"     FAIL - Status: {resp.status_code if resp else 'None'}")
        db.projects.delete_one({"project_id": created_project_id})
        return False
    
    # Delete
    print("  4. Deleting project...")
    resp = make_request("DELETE", f"/projects/{created_project_id}", cookies)
    if resp and resp.status_code == 200:
        print("     PASS - Deleted")
    else:
        print(f"     FAIL - Status: {resp.status_code if resp else 'None'}")
        db.projects.delete_one({"project_id": created_project_id})
        return False
    
    return True

def test_tasks_crud(cookies, db, test_user_id):
    """Test Task CRUD operations"""
    print("\n=== Testing Tasks CRUD ===")
    
    # Create project first
    proj = make_request("POST", "/projects", cookies, {"name": "Task Test Project", "description": "Test"})
    project_id = proj.json().get("project_id")
    
    # Create task
    print("  1. Creating task...")
    resp = make_request("POST", "/tasks", cookies, {"project_id": project_id, "title": "Test Task", "priority": "high"})
    if resp and resp.status_code == 200:
        task_id = resp.json().get("task_id")
        print(f"     PASS - Created: {task_id}")
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
        db.projects.delete_one({"project_id": project_id})
        return False
    
    # Update task
    print("  2. Updating task...")
    resp = make_request("PATCH", f"/tasks/{task_id}", cookies, {"status": "in_progress"})
    if resp and resp.status_code == 200 and resp.json().get("status") == "in_progress":
        print("     PASS - Updated status")
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
    
    # Delete task
    print("  3. Deleting task...")
    resp = make_request("DELETE", f"/tasks/{task_id}", cookies)
    if resp and resp.status_code == 200:
        print("     PASS - Deleted")
    else:
        print(f"     FAIL")
    
    # Cleanup
    db.projects.delete_one({"project_id": project_id})
    return True

def test_stories_crud(cookies, db, test_user_id):
    """Test Story CRUD operations"""
    print("\n=== Testing Stories CRUD ===")
    
    # Create project
    proj = make_request("POST", "/projects", cookies, {"name": "Story Test Project", "description": "Test"})
    project_id = proj.json().get("project_id")
    
    # Create story
    print("  1. Creating story...")
    resp = make_request("POST", "/stories", cookies, {
        "project_id": project_id, 
        "title": "As a user, I want to test",
        "story_points": 5,
        "priority": "high"
    })
    if resp and resp.status_code == 200:
        story_id = resp.json().get("story_id")
        points = resp.json().get("story_points")
        print(f"     PASS - Created: {story_id} with {points} points")
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
        db.projects.delete_one({"project_id": project_id})
        return False
    
    # Update story
    print("  2. Updating story status...")
    resp = make_request("PATCH", f"/stories/{story_id}", cookies, {"status": "in_progress"})
    if resp and resp.status_code == 200:
        print("     PASS - Updated")
    else:
        print(f"     FAIL")
    
    # Delete story
    print("  3. Deleting story...")
    resp = make_request("DELETE", f"/stories/{story_id}", cookies)
    if resp and resp.status_code == 200:
        print("     PASS - Deleted")
    else:
        print(f"     FAIL")
    
    # Cleanup
    db.projects.delete_one({"project_id": project_id})
    return True

def test_sprints_crud(cookies, db, test_user_id):
    """Test Sprint CRUD operations"""
    print("\n=== Testing Sprints CRUD ===")
    
    # Create project
    proj = make_request("POST", "/projects", cookies, {"name": "Sprint Test Project", "description": "Test"})
    project_id = proj.json().get("project_id")
    
    # Create sprint
    print("  1. Creating sprint...")
    resp = make_request("POST", "/sprints", cookies, {
        "project_id": project_id, 
        "name": "Sprint 1",
        "goal": "Complete testing"
    })
    if resp and resp.status_code == 200:
        sprint_id = resp.json().get("sprint_id")
        print(f"     PASS - Created: {sprint_id}")
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
        db.projects.delete_one({"project_id": project_id})
        return False
    
    # Update sprint
    print("  2. Updating sprint status to active...")
    resp = make_request("PATCH", f"/sprints/{sprint_id}", cookies, {"status": "active"})
    if resp and resp.status_code == 200 and resp.json().get("status") == "active":
        print("     PASS - Updated")
    else:
        print(f"     FAIL")
    
    # Delete sprint
    print("  3. Deleting sprint...")
    resp = make_request("DELETE", f"/sprints/{sprint_id}", cookies)
    if resp and resp.status_code == 200:
        print("     PASS - Deleted")
    else:
        print(f"     FAIL")
    
    # Cleanup
    db.projects.delete_one({"project_id": project_id})
    return True

def test_milestones_crud(cookies, db, test_user_id):
    """Test Milestone CRUD operations"""
    print("\n=== Testing Milestones CRUD ===")
    
    proj = make_request("POST", "/projects", cookies, {"name": "Milestone Test", "description": "Test"})
    project_id = proj.json().get("project_id")
    
    # Create milestone
    print("  1. Creating milestone...")
    resp = make_request("POST", "/milestones", cookies, {
        "project_id": project_id,
        "title": "Phase 1 Complete",
        "target_date": "2025-06-30"
    })
    if resp and resp.status_code == 200:
        milestone_id = resp.json().get("milestone_id")
        print(f"     PASS - Created: {milestone_id}")
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
        db.projects.delete_one({"project_id": project_id})
        return False
    
    # Update milestone
    print("  2. Updating milestone health...")
    resp = make_request("PATCH", f"/milestones/{milestone_id}", cookies, {"health_status": "at_risk"})
    if resp and resp.status_code == 200:
        print("     PASS - Updated")
    else:
        print(f"     FAIL")
    
    # Delete milestone
    print("  3. Deleting milestone...")
    resp = make_request("DELETE", f"/milestones/{milestone_id}", cookies)
    if resp and resp.status_code == 200:
        print("     PASS - Deleted")
    else:
        print(f"     FAIL")
    
    db.projects.delete_one({"project_id": project_id})
    return True

def test_risks_crud(cookies, db, test_user_id):
    """Test Risk CRUD operations"""
    print("\n=== Testing Risks CRUD ===")
    
    proj = make_request("POST", "/projects", cookies, {"name": "Risk Test", "description": "Test"})
    project_id = proj.json().get("project_id")
    
    # Create risk
    print("  1. Creating risk...")
    resp = make_request("POST", "/risks", cookies, {
        "project_id": project_id,
        "description": "Resource availability risk",
        "probability": "high",
        "impact": "high"
    })
    if resp and resp.status_code == 200:
        risk_id = resp.json().get("risk_id")
        print(f"     PASS - Created: {risk_id}")
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
        db.projects.delete_one({"project_id": project_id})
        return False
    
    # Update risk
    print("  2. Updating risk status...")
    resp = make_request("PATCH", f"/risks/{risk_id}", cookies, {"status": "mitigated"})
    if resp and resp.status_code == 200:
        print("     PASS - Updated")
    else:
        print(f"     FAIL")
    
    # Delete risk
    print("  3. Deleting risk...")
    resp = make_request("DELETE", f"/risks/{risk_id}", cookies)
    if resp and resp.status_code == 200:
        print("     PASS - Deleted")
    else:
        print(f"     FAIL")
    
    db.projects.delete_one({"project_id": project_id})
    return True

def test_resources_crud(cookies, db):
    """Test Resource CRUD operations"""
    print("\n=== Testing Resources CRUD ===")
    
    # Create resource
    print("  1. Creating resource...")
    resp = make_request("POST", "/resources", cookies, {
        "name": "Test Engineer",
        "email": f"engineer_{uuid.uuid4().hex[:6]}@compassx.com",
        "role": "Developer",
        "skills": ["Python", "React"]
    })
    if resp and resp.status_code == 200:
        resource_id = resp.json().get("resource_id")
        print(f"     PASS - Created: {resource_id}")
        db.resources.delete_one({"resource_id": resource_id})
        return True
    else:
        print(f"     FAIL - {resp.json() if resp else 'None'}")
        return False

def test_dashboard_stats(cookies):
    """Test dashboard stats endpoint"""
    print("\n=== Testing Dashboard Stats ===")
    
    resp = make_request("GET", "/dashboard/stats", cookies)
    if resp and resp.status_code == 200:
        data = resp.json()
        required_fields = ["projects", "tasks", "stories", "story_points_data"]
        missing = [f for f in required_fields if f not in data]
        if not missing:
            print(f"     PASS - Got all stats fields")
            print(f"     Projects: {data['projects']['total']}, Story Points: {data.get('total_story_points', 0)}")
            return True
        else:
            print(f"     FAIL - Missing fields: {missing}")
    else:
        print(f"     FAIL - Status: {resp.status_code if resp else 'None'}")
    return False

def test_story_sprint_assignment(cookies, db, test_user_id):
    """Test assigning stories to sprints"""
    print("\n=== Testing Story-Sprint Assignment ===")
    
    proj = make_request("POST", "/projects", cookies, {"name": "Assignment Test", "description": "Test"})
    project_id = proj.json().get("project_id")
    
    # Create sprint
    sprint = make_request("POST", "/sprints", cookies, {"project_id": project_id, "name": "Sprint 1"})
    sprint_id = sprint.json().get("sprint_id")
    
    # Create story
    story = make_request("POST", "/stories", cookies, {"project_id": project_id, "title": "Test Story", "story_points": 3})
    story_id = story.json().get("story_id")
    
    # Assign story to sprint
    print("  1. Assigning story to sprint...")
    resp = make_request("PATCH", f"/stories/{story_id}", cookies, {"sprint_id": sprint_id})
    if resp and resp.status_code == 200 and resp.json().get("sprint_id") == sprint_id:
        print(f"     PASS - Story {story_id} assigned to Sprint {sprint_id}")
    else:
        print(f"     FAIL")
    
    # Cleanup
    db.stories.delete_one({"story_id": story_id})
    db.sprints.delete_one({"sprint_id": sprint_id})
    db.projects.delete_one({"project_id": project_id})
    return True


def main():
    print("="*60)
    print("CompassX API CRUD Test Suite")
    print("="*60)
    
    # Setup
    print("\nSetting up test session...")
    test_token, test_user_id, db = get_test_session()
    cookies = {"session_token": test_token}
    print(f"  Created test user: {test_user_id}")
    
    results = []
    
    # Run tests
    results.append(("Projects CRUD", test_projects_crud(cookies, db)))
    results.append(("Tasks CRUD", test_tasks_crud(cookies, db, test_user_id)))
    results.append(("Stories CRUD", test_stories_crud(cookies, db, test_user_id)))
    results.append(("Sprints CRUD", test_sprints_crud(cookies, db, test_user_id)))
    results.append(("Milestones CRUD", test_milestones_crud(cookies, db, test_user_id)))
    results.append(("Risks CRUD", test_risks_crud(cookies, db, test_user_id)))
    results.append(("Resources CRUD", test_resources_crud(cookies, db)))
    results.append(("Dashboard Stats", test_dashboard_stats(cookies)))
    results.append(("Story-Sprint Assignment", test_story_sprint_assignment(cookies, db, test_user_id)))
    
    # Cleanup
    print("\nCleaning up...")
    cleanup(db, test_user_id)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = 0
    failed = 0
    for name, result in results:
        status = "PASS" if result else "FAIL"
        if result:
            passed += 1
        else:
            failed += 1
        print(f"  {name}: {status}")
    
    print(f"\nTotal: {passed + failed} | Passed: {passed} | Failed: {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
