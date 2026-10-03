from server.database import FirestoreClient, ProjectRepository


def test_firestore_client_starts_without_backend():
    client = FirestoreClient(project_id="demo")
    assert client.project_id == "demo"
    assert client.collection("projects") is not None


def test_project_repository_can_store_payload():
    repo = ProjectRepository(FirestoreClient(project_id="demo"))
    payload = {"project_id": "proj_1", "name": "Demo Project"}
    stored = repo.create("proj_1", payload)
    assert stored["name"] == "Demo Project"
    assert repo.get("proj_1")["project_id"] == "proj_1"
