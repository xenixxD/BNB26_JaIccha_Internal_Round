from pathlib import Path

from server.storage import StorageService


def test_storage_service_builds_expected_paths(tmp_path):
    service = StorageService(str(tmp_path))
    service.ensure_directories()
    assert Path(tmp_path, "sources").exists()
    assert Path(tmp_path, "derived").exists()
    assert Path(tmp_path, "outputs").exists()
    assert Path(tmp_path, "tmp").exists()


def test_storage_service_handles_temp_file(tmp_path):
    service = StorageService(str(tmp_path))
    result = service.temp_file("project_1", "job_1", "demo.txt", b"hello")
    assert Path(result["path"]).exists()
    assert Path(result["path"]).read_bytes() == b"hello"
