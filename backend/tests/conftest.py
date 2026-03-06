import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://project-planner-ai-1.preview.emergentagent.com')
SESSION_TOKEN = "test_session_1772823453557"

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}

@pytest.fixture
def authenticated_client(api_client):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {SESSION_TOKEN}"})
    return api_client
