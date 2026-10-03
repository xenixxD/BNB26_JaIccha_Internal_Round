from pathlib import Path

from server.creatorai.pipeline import CreatorAIPipeline, ProcessingRequest


def test_creatorai_pipeline_processes_content(tmp_path):
    pipeline = CreatorAIPipeline(storage_service=None)
    request = ProcessingRequest(
        project_id="proj_creatorai",
        asset_id="asset_creatorai",
        filename="demo.mp4",
        transcript="This short-form creator clip highlights a workflow for editing, packaging, and publishing high-performing content.",
        project_name="CreatorAI Demo",
        project_description="Starter pipeline validation",
        storage_root=str(tmp_path),
    )

    result = pipeline.process(request)

    assert result.project_id == "proj_creatorai"
    assert result.asset_id == "asset_creatorai"
    assert result.summary
    assert result.insights
    assert len(result.candidates) == 1
    assert Path(result.asset_path).exists()

    payload = result.to_dict()
    assert payload["metadata"]["project"]["name"] == "CreatorAI Demo"
    assert payload["candidates"][0]["asset_id"] == "asset_creatorai"
