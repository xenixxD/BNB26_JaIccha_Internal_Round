from server.ai.clip_candidate import build_candidates
from server.ai.content_understanding import understand_content
from server.database.asset_service import AssetService
from server.database.project_service import ProjectService
from server.storage.object_store import ObjectStore
from server.storage.source_asset import SourceAsset


def test_project_service_and_asset_service_roundtrip():
    project_service = ProjectService()
    asset_service = AssetService()
    project_payload = project_service.create_project("proj_1", "Demo Project", "Test project")
    asset_payload = asset_service.create_asset("asset_1", "proj_1", "demo.mp4", checksum_sha256="a" * 64)
    assert project_payload["name"] == "Demo Project"
    assert asset_payload["filename"] == "demo.mp4"


def test_storage_object_store_roundtrip(tmp_path):
    store = ObjectStore(str(tmp_path))
    input_path = tmp_path / "source.txt"
    input_path.write_text("hello")
    saved = store.upload(str(input_path), "nested/source.txt")
    assert saved.endswith("nested/source.txt")
    destination = tmp_path / "downloaded.txt"
    assert store.download("nested/source.txt", str(destination)).endswith("downloaded.txt")


def test_content_understanding_and_candidates():
    result = understand_content("This is a long-form video transcript about creator workflows and AI editing.")
    candidates = build_candidates([
        {"start": 0.0, "end": 12.0, "text": "This is a long-form video transcript about creator workflows and AI editing.", "asset_id": "asset_1", "project_id": "proj_1"}
    ])
    assert result.summary
    assert candidates[0].summary


def test_source_asset_roundtrip():
    asset = SourceAsset(
        asset_id="asset_1",
        project_id="proj_1",
        source_path="/tmp/original.mp4",
        filename="original.mp4",
        checksum_sha256="b" * 64,
        mime_type="video/mp4",
    )
    assert asset.to_dict()["filename"] == "original.mp4"
