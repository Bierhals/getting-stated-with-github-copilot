from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


# Keep a snapshot of initial participants so tests can restore state
_initial_participants = {k: v["participants"][:] for k, v in activities.items()}


@pytest.fixture(autouse=True)
def reset_activities():
    # Restore participants before each test to avoid cross-test interference
    for k in activities:
        activities[k]["participants"] = _initial_participants[k][:]


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow(client):
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Ensure clean start
    assert email not in activities[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_un = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp_un.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should return 404
    resp_un2 = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp_un2.status_code == 404


def test_signup_invalid_activity(client):
    resp = client.post("/activities/Nonexistent/signup?email=foo@bar.com")
    assert resp.status_code == 404
