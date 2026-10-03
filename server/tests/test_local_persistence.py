import asyncio
import hashlib
from io import BytesIO
import os
import tempfile
import unittest
from unittest.mock import patch

_import_data_dir = tempfile.TemporaryDirectory()
os.environ["CREATORAI_LOCAL_DATA_DIR"] = _import_data_dir.name

from server import database


class LocalPersistenceTests(unittest.TestCase):
    def setUp(self):
        self.data_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.data_dir.cleanup)
        self.database_path = os.path.join(self.data_dir.name, "creatorai.db")
        self.database_path_patch = patch.object(database, "DB_PATH", self.database_path)
        self.database_path_patch.start()
        self.addCleanup(self.database_path_patch.stop)
        database.init_db()

    def test_new_workspace_does_not_seed_demo_data(self):
        self.assertEqual(database.list_projects(), [])
        self.assertEqual(database.list_assets(), [])
        self.assertEqual(database.list_clips(), [])

    def test_assets_and_clips_require_an_existing_project(self):
        with self.assertRaisesRegex(ValueError, "Project ID is required"):
            database.create_asset({"filename": "source.mp4"})
        with self.assertRaisesRegex(ValueError, "Project ID is required"):
            database.create_clip({"title": "Clip without project"})

    def test_transcript_cache_persists_and_is_invalidated_when_source_changes(self):
        project = database.create_project({"name": "Transcript persistence"})
        content = b"\x00\x00\x00\x18ftypisom test media"
        checksum = hashlib.sha256(content).hexdigest()
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
            "checksum": checksum,
            "mimeType": "video/mp4",
        })
        transcript = database.save_transcript(
            asset_id=asset["id"],
            source_checksum=checksum,
            provider="test-provider",
            model="test-model",
            text="A grounded transcript.",
            duration=4,
            segments=[{"start": 0, "end": 2, "text": "A grounded transcript."}],
        )

        database.init_db()

        cached = database.get_cached_transcript(asset["id"])
        if cached is None:
            self.fail("Persisted transcript was not available after database reinitialization")
        self.assertEqual(cached["id"], transcript["id"])
        self.assertEqual(cached["segments"][0]["text"], "A grounded transcript.")
        database.update_asset(asset["id"], {"checksum": "changed-source-checksum"})
        self.assertIsNone(database.get_cached_transcript(asset["id"]))

    def test_transcript_rejects_invalid_timestamped_segments(self):
        project = database.create_project({"name": "Transcript validation"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
            "checksum": "source-checksum",
        })
        with self.assertRaisesRegex(ValueError, "invalid timing or text"):
            database.save_transcript(
                asset_id=asset["id"],
                source_checksum="source-checksum",
                provider="test-provider",
                model="test-model",
                text="Transcript",
                duration=4,
                segments=[{"start": 2, "end": 1, "text": "Invalid timing"}],
            )

    def test_transcription_without_provider_reports_unavailable_without_fake_text(self):
        from server import ai_engine

        with patch.object(ai_engine, "groq_client", None):
            result = ai_engine.transcribe_media_file("unused-local-path.mp4")

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["error_code"], "TRANSCRIPTION_PROVIDER_UNAVAILABLE")
        self.assertNotIn("text", result)

    def test_asset_transcription_route_caches_provider_result(self):
        from server import main

        project = database.create_project({"name": "Transcription API"})
        media = b"\x00\x00\x00\x18ftypisom media for transcription"
        checksum = hashlib.sha256(media).hexdigest()
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
            "checksum": checksum,
        })
        assets_dir = os.path.join(self.data_dir.name, "assets")
        os.makedirs(assets_dir)
        with open(os.path.join(assets_dir, "source.mp4"), "wb") as media_file:
            media_file.write(media)

        provider_result = {
            "status": "success",
            "provider": "test-provider",
            "model": "test-model",
            "text": "Words spoken in the uploaded media.",
            "duration": 4,
            "segments": [{"start": 0, "end": 3, "text": "Words spoken in the uploaded media."}],
        }
        def fake_semantic_matcher(**context):
            if context["script_text"].startswith("Unrelated"):
                return []
            return [{
                "project_id": context["project_id"],
                "source_asset_id": context["source_asset_id"],
                "script_version_id": context["script_version_id"],
                "transcript_id": context["transcript_id"],
                "script_section_index": 0,
                "script_section": context["script_text"],
                "start_time": 0.0,
                "end_time": 3.0,
                "transcript_text": "Words spoken in the uploaded media.",
                "semantic_score": 92.0,
                "completeness_score": 100.0,
                "visual_score": None,
                "duration_score": 20.0,
                "final_score": 79.2,
                "reasons": ["Semantic similarity: 92.0/100"],
                "status": "suggested",
            }]

        with patch.object(main, "ASSETS_DIR", assets_dir), patch.object(
            main, "transcribe_media_file", return_value=provider_result
        ) as transcribe, patch.object(
            main, "match_script_semantically", side_effect=fake_semantic_matcher
        ):
            first = main.api_transcribe_asset(asset["id"])
            second = main.api_transcribe_asset(asset["id"])
            matched = main.api_script_match(main.ScriptMatchRequest(
                asset_id=asset["id"],
                script_text="Words spoken in the uploaded media.",
                script_title="Launch script",
            ))
            unmatched = main.api_script_match(main.ScriptMatchRequest(
                asset_id=asset["id"],
                script_text="Unrelated astronomy vocabulary.",
                script_title="Launch script",
            ))

        transcribe.assert_called_once()
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(second["segments"][0]["start"], 0)
        self.assertEqual(matched.transcript_id, first["id"])
        self.assertEqual(len(matched.matches), 1)
        self.assertEqual(matched.matches[0].start_time, 0)
        self.assertEqual(matched.matches[0].confidence_score, 79.2)
        self.assertEqual(matched.candidates[0].semantic_score, 92.0)
        self.assertEqual(matched.candidates[0].script_version_id, matched.script_version_id)
        self.assertEqual(unmatched.matches, [])
        self.assertNotEqual(matched.script_version_id, unmatched.script_version_id)
        self.assertEqual(
            len(database.list_clip_candidates(project["id"], asset["id"], matched.script_version_id)),
            1,
        )
        self.assertEqual(
            database.list_clip_candidates(project["id"], asset["id"], unmatched.script_version_id),
            [],
        )
        self.assertEqual(
            len(database.list_project_scripts(project["id"], asset["id"])[0]["versions"]),
            2,
        )
        self.assertEqual(
            len(main.get_project_scripts(project["id"], asset["id"])[0]["versions"]),
            2,
        )
        self.assertEqual(
            len(main.get_project_clip_candidates(
                project["id"],
                source_asset_id=asset["id"],
                script_version_id=matched.script_version_id,
            )),
            1,
        )

    def test_script_version_is_saved_even_when_transcription_is_unavailable(self):
        from fastapi import HTTPException
        from server import main

        project = database.create_project({"name": "Script retention"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        request = main.ScriptMatchRequest(
            asset_id=asset["id"],
            script_title="Saved before transcription",
            script_text="The script remains available after a transcription failure.",
        )

        with patch.object(
            main,
            "_get_or_create_asset_transcript",
            side_effect=HTTPException(status_code=503, detail="Transcription unavailable"),
        ):
            with self.assertRaises(HTTPException):
                main.api_script_match(request)

        scripts = database.list_project_scripts(project["id"], asset["id"])
        self.assertEqual(scripts[0]["title"], "Saved before transcription")
        self.assertEqual(len(scripts[0]["versions"]), 1)

    def test_script_versions_are_immutable_idempotent_and_reuse_matching_content(self):
        project = database.create_project({"name": "Script versions"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })

        first = database.create_or_get_script_version(
            project["id"], asset["id"], "Launch", "Original script."
        )
        repeated = database.create_or_get_script_version(
            project["id"], asset["id"], "Launch", "Original script."
        )
        edited = database.create_or_get_script_version(
            project["id"], asset["id"], "Launch", "Revised script."
        )
        restored = database.create_or_get_script_version(
            project["id"], asset["id"], "Launch", "Original script."
        )

        self.assertEqual(first["script_version_id"], repeated["script_version_id"])
        self.assertEqual(first["script_version_id"], restored["script_version_id"])
        self.assertNotEqual(first["script_version_id"], edited["script_version_id"])
        versions = database.list_project_scripts(project["id"], asset["id"])[0]["versions"]
        self.assertEqual([item["version"] for item in versions], [2, 1])
        self.assertEqual(versions[1]["text"], "Original script.")

    def test_script_candidates_are_deterministic_replaceable_and_deleted_with_asset(self):
        project = database.create_project({"name": "Candidate persistence"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
            "checksum": "source-checksum",
        })
        transcript = database.save_transcript(
            asset_id=asset["id"],
            source_checksum="source-checksum",
            provider="test-provider",
            model="test-model",
            text="A transcript for candidate persistence.",
            duration=20,
            segments=[{"start": 0, "end": 18, "text": "A transcript for candidate persistence."}],
        )
        script = database.create_or_get_script_version(
            project["id"], asset["id"], "Candidate script", "Candidate text."
        )
        candidate = {
            "project_id": project["id"],
            "source_asset_id": asset["id"],
            "script_version_id": script["script_version_id"],
            "transcript_id": transcript["id"],
            "script_section_index": 0,
            "script_section": "Candidate text.",
            "start_time": 0.0,
            "end_time": 18.0,
            "transcript_text": "A transcript for candidate persistence.",
            "semantic_score": 80.0,
            "completeness_score": 25.0,
            "visual_score": None,
            "duration_score": 100.0,
            "final_score": 66.25,
            "reasons": ["Test candidate"],
            "status": "suggested",
        }

        first = database.save_clip_candidates(
            [candidate], script["script_version_id"], transcript["id"]
        )
        second = database.save_clip_candidates(
            [candidate], script["script_version_id"], transcript["id"]
        )
        self.assertEqual(first[0]["id"], second[0]["id"])
        database.init_db()
        self.assertEqual(
            database.list_clip_candidates(project["id"], asset["id"], script["script_version_id"])[0]["reasons"],
            ["Test candidate"],
        )
        database.save_clip_candidates([], script["script_version_id"], transcript["id"])
        self.assertEqual(database.list_clip_candidates(project["id"]), [])

        database.save_clip_candidates(
            [candidate], script["script_version_id"], transcript["id"]
        )
        database.delete_asset(asset["id"])
        self.assertEqual(database.list_clip_candidates(project["id"]), [])
        self.assertEqual(database.list_project_scripts(project["id"]), [])

    def test_script_candidate_provenance_survives_clip_updates_and_draft_versions(self):
        project = database.create_project({"name": "Clip provenance"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        provenance = {
            "sourceCandidateId": "candidate-1",
            "scriptId": "script-1",
            "scriptVersionId": "script-version-1",
            "transcriptId": "transcript-1",
            "rankScore": 82.5,
            "matchReasons": ["Semantic similarity: 82.5/100"],
        }
        clip = database.create_clip({
            "projectId": project["id"],
            "assetId": asset["id"],
            "title": "Script match",
            "startTime": 8,
            "endTime": 24,
            "metadata": provenance,
        })
        self.assertEqual(clip["metadata"], provenance)

        database.update_clip(clip["id"], {"title": "Edited script match"})
        draft = database.save_clip_draft(clip["id"], {"caption": "Edited from the match."})

        self.assertEqual(draft["payload"]["metadata"], provenance)
        self.assertEqual(database.list_clip_drafts(clip["id"])[0]["payload"]["metadata"], provenance)

    def test_render_jobs_persist_terminal_status_and_recover_interrupted_work(self):
        project = database.create_project({"name": "Render jobs"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        completed_job = database.create_render_job({
            "task_id": "render-completed",
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": "clip-completed",
            "duration_seconds": 12,
        })
        self.assertEqual(completed_job["status"], "queued")
        database.update_render_job("render-completed", {"status": "processing", "progress": 1})
        completed = database.update_render_job("render-completed", {
            "status": "completed",
            "progress": 100,
            "output_filename": "render.mp4",
            "output_url": "/exports/render.mp4",
            "file_size_bytes": 1234,
            "duration_seconds": 12,
            "ffmpeg_used": True,
        })
        interrupted_job = database.create_render_job({
            "task_id": "render-interrupted",
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": "clip-interrupted",
            "duration_seconds": 8,
        })
        database.update_render_job(interrupted_job["task_id"], {
            "status": "processing",
            "progress": 1,
        })
        queued_job = database.create_render_job({
            "task_id": "render-queued",
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": "clip-queued",
            "duration_seconds": 5,
        })

        database.init_db()
        recovered_count = database.recover_interrupted_render_jobs()

        self.assertEqual(recovered_count, 2)
        persisted = database.get_render_job(completed["task_id"])
        self.assertEqual(persisted["status"], "completed")
        self.assertEqual(persisted["output_url"], "/exports/render.mp4")
        interrupted = database.get_render_job(interrupted_job["task_id"])
        self.assertEqual(interrupted["status"], "failed")
        self.assertIn("Server restarted", interrupted["error_message"])
        queued = database.get_render_job(queued_job["task_id"])
        if queued is None:
            self.fail("Queued render job disappeared during startup recovery")
        self.assertEqual(queued["status"], "failed")
        self.assertEqual(len(database.list_render_jobs(project["id"])), 3)
        with self.assertRaisesRegex(ValueError, "already completed"):
            database.update_render_job("render-completed", {"status": "failed"})

    def test_trim_api_persists_job_and_returns_durable_status(self):
        from server import main

        project = database.create_project({"name": "Trim API"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        assets_dir = os.path.join(self.data_dir.name, "assets")
        outputs_dir = os.path.join(self.data_dir.name, "outputs")
        os.makedirs(assets_dir)
        os.makedirs(outputs_dir)
        with open(os.path.join(assets_dir, "source.mp4"), "wb") as media:
            media.write(b"test source")

        def fake_trim(**arguments):
            filename = "generated.mp4"
            with open(os.path.join(outputs_dir, filename), "wb") as output:
                output.write(b"valid test export")
            return {
                "task_id": arguments["task_id"],
                "clip_id": arguments["clip_id"],
                "status": "completed",
                "progress": 100.0,
                "output_filename": filename,
                "output_url": f"/exports/{filename}",
                "file_size_bytes": len(b"valid test export"),
                "duration_seconds": arguments["end_time"] - arguments["start_time"],
                "error_message": None,
                "ffmpeg_used": True,
            }

        with patch.object(main, "ASSETS_DIR", assets_dir), patch.object(
            main, "OUTPUTS_DIR", outputs_dir
        ), patch.object(main, "process_video_trim", side_effect=fake_trim):
            response = main.api_trim_clip(main.ClipTrimRequest(
                asset_id=asset["id"],
                start_time=2,
                end_time=14,
                aspect_ratio="9:16",
            ))
            status = main.api_clip_status(response.task_id)
            jobs = main.get_project_render_jobs(project["id"])

        self.assertEqual(response.status, "completed")
        self.assertEqual(status.task_id, response.task_id)
        self.assertEqual(status.output_url, "/exports/generated.mp4")
        self.assertEqual(jobs[0]["status"], "completed")
        self.assertEqual(database.list_outputs(project["id"])[0]["url"], "/exports/generated.mp4")

    def test_trim_request_rejects_invalid_range_and_aspect_ratio(self):
        from server.schemas import ClipTrimRequest
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            ClipTrimRequest(asset_id="asset-1", start_time=10, end_time=10)
        with self.assertRaises(ValidationError):
            ClipTrimRequest(
                asset_id="asset-1",
                start_time=0,
                end_time=10,
                aspect_ratio="4:3",
            )

    def test_workspace_drafts_state_and_outputs_survive_database_reinitialization(self):
        project = database.create_project({"name": "Persistence test"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        script = database.create_asset({
            "projectId": project["id"],
            "filename": "script.txt",
            "fileType": "script",
            "content": "Persisted script text",
        })
        clip = database.create_clip({
            "projectId": project["id"],
            "assetId": asset["id"],
            "title": "Initial title",
            "startTime": 2,
            "endTime": 12,
        })
        first_draft = database.save_clip_draft(clip["id"], {"title": "Draft one"})
        second_draft = database.save_clip_draft(clip["id"], {"caption": "Draft two"})
        database.save_project_state(
            project["id"],
            "candidateMoments",
            [{"id": "candidate-1", "assetId": asset["id"]}],
        )

        assets_dir = os.path.join(self.data_dir.name, "assets")
        os.makedirs(assets_dir)
        uploaded_file = os.path.join(assets_dir, "source.mp4")
        with open(uploaded_file, "wb") as media:
            media.write(b"test media bytes")

        database.create_output({
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": clip["id"],
            "draft_id": second_draft["id"],
            "filename": "clip.mp4",
            "url": "/exports/clip.mp4",
            "file_size": 16,
        })

        database.init_db()

        self.assertIn(
            project["id"],
            {item["id"] for item in database.list_projects()},
        )
        persisted_assets = database.list_assets(project["id"])
        self.assertEqual(
            next(item for item in persisted_assets if item["id"] == script["id"])["content"],
            "Persisted script text",
        )
        self.assertTrue(os.path.isfile(uploaded_file))

        persisted_state = database.get_project_state(project["id"])
        self.assertEqual(
            persisted_state["candidateMoments"]["data"][0]["assetId"],
            asset["id"],
        )

        drafts = database.list_clip_drafts(clip["id"])
        self.assertEqual([draft["version"] for draft in drafts], [1, 2])
        self.assertIsNone(first_draft["parent_id"])
        self.assertEqual(second_draft["parent_id"], first_draft["id"])
        self.assertEqual(drafts[0]["payload"]["title"], "Draft one")
        self.assertEqual(drafts[1]["payload"]["caption"], "Draft two")

        outputs = database.list_outputs(project["id"])
        self.assertEqual(outputs[0]["draft_id"], second_draft["id"])
        self.assertEqual(outputs[0]["url"], "/exports/clip.mp4")

    def test_deleting_asset_removes_dependent_database_records(self):
        project = database.create_project({"name": "Deletion test"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        clip = database.create_clip({
            "projectId": project["id"],
            "assetId": asset["id"],
            "title": "Dependent clip",
            "startTime": 0,
            "endTime": 10,
        })
        draft = database.save_clip_draft(clip["id"], {"title": "Saved version"})
        database.create_render_job({
            "task_id": "render-for-deleted-asset",
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": clip["id"],
            "draft_id": draft["id"],
            "duration_seconds": 10,
        })
        database.create_output({
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": clip["id"],
            "draft_id": draft["id"],
            "filename": "clip.mp4",
            "url": "/exports/clip.mp4",
            "file_size": 16,
        })

        deleted = database.delete_asset(asset["id"])

        self.assertEqual(deleted["clip_ids"], [clip["id"]])
        self.assertEqual(deleted["output_urls"], ["/exports/clip.mp4"])
        self.assertEqual(database.list_assets(project["id"]), [])
        self.assertEqual(database.list_clips(project["id"]), [])
        self.assertEqual(database.list_clip_drafts(clip["id"]), [])
        self.assertEqual(database.list_outputs(project["id"]), [])
        self.assertEqual(database.list_render_jobs(project["id"]), [])
        project_after_delete = next(
            item for item in database.list_projects() if item["id"] == project["id"]
        )
        self.assertEqual(project_after_delete["assetsCount"], 0)
        self.assertEqual(project_after_delete["clipsCount"], 0)

    def test_upload_and_asset_delete_api_persist_and_remove_local_media(self):
        from server import main
        from starlette.datastructures import UploadFile

        project = database.create_project({"name": "Upload route test"})
        assets_dir = os.path.join(self.data_dir.name, "assets")
        outputs_dir = os.path.join(self.data_dir.name, "outputs")
        os.makedirs(assets_dir)
        os.makedirs(outputs_dir)
        with patch.object(main, "ASSETS_DIR", assets_dir), patch.object(
            main, "OUTPUTS_DIR", outputs_dir
        ):
            upload = UploadFile(
                filename="source.mp4",
                file=BytesIO(b"\x00\x00\x00\x18ftypisom persistent uploaded bytes"),
            )
            asset_response = asyncio.run(
                main.upload_asset(upload, project["id"], "video")
            )
            saved_asset_path = os.path.join(
                assets_dir,
                os.path.basename(asset_response.url),
            )
            self.assertTrue(os.path.isfile(saved_asset_path))
            self.assertEqual(asset_response.mime_type, "video/mp4")
            self.assertEqual(
                asset_response.checksum,
                hashlib.sha256(b"\x00\x00\x00\x18ftypisom persistent uploaded bytes").hexdigest(),
            )
            with self.assertRaises(main.HTTPException) as invalid_upload:
                asyncio.run(main.upload_asset(
                    UploadFile(filename="spoofed.mp4", file=BytesIO(b"not an mp4")),
                    project["id"],
                    "video",
                ))
            self.assertEqual(invalid_upload.exception.status_code, 400)
            self.assertEqual(len(os.listdir(assets_dir)), 1)

            clip = database.create_clip({
                "projectId": project["id"],
                "assetId": asset_response.id,
                "title": "Uploaded asset clip",
                "startTime": 0,
                "endTime": 10,
            })
            draft = database.save_clip_draft(clip["id"], {"title": "Saved"})
            output_path = os.path.join(outputs_dir, "render.mp4")
            with open(output_path, "wb") as media:
                media.write(b"render bytes")
            database.create_output({
                "project_id": project["id"],
                "asset_id": asset_response.id,
                "clip_id": clip["id"],
                "draft_id": draft["id"],
                "filename": "render.mp4",
                "url": "/exports/render.mp4",
                "file_size": 12,
            })

            delete_response = main.delete_existing_asset(asset_response.id)

        self.assertTrue(delete_response["deleted"])
        self.assertEqual(delete_response["clip_ids"], [clip["id"]])
        self.assertFalse(os.path.exists(saved_asset_path))
        self.assertFalse(os.path.exists(output_path))
        database.init_db()
        self.assertIsNone(
            next(
                (asset for asset in database.list_assets(project["id"])
                 if asset["id"] == asset_response.id),
                None,
            )
        )

    def test_project_delete_api_cascades_data_and_removes_local_media(self):
        from server import main

        project = database.create_project({"name": "Project to delete"})
        retained_project = database.create_project({"name": "Project to keep"})
        asset = database.create_asset({
            "projectId": project["id"],
            "filename": "source.mp4",
            "fileType": "video",
            "url": "/uploads/source.mp4",
        })
        clip = database.create_clip({
            "projectId": project["id"],
            "assetId": asset["id"],
            "title": "Project clip",
            "startTime": 0,
            "endTime": 10,
        })
        draft = database.save_clip_draft(clip["id"], {"title": "Project draft"})
        database.save_project_state(project["id"], "transcript", ["saved transcript"])
        database.create_render_job({
            "task_id": "project-render-job",
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": clip["id"],
            "draft_id": draft["id"],
            "duration_seconds": 10,
        })
        database.create_output({
            "project_id": project["id"],
            "asset_id": asset["id"],
            "clip_id": clip["id"],
            "draft_id": draft["id"],
            "filename": "render.mp4",
            "url": "/exports/render.mp4",
            "file_size": 12,
        })

        assets_dir = os.path.join(self.data_dir.name, "assets")
        outputs_dir = os.path.join(self.data_dir.name, "outputs")
        os.makedirs(assets_dir)
        os.makedirs(outputs_dir)
        asset_path = os.path.join(assets_dir, "source.mp4")
        output_path = os.path.join(outputs_dir, "render.mp4")
        for media_path in (asset_path, output_path):
            with open(media_path, "wb") as media:
                media.write(b"local media")

        with patch.object(main, "ASSETS_DIR", assets_dir), patch.object(
            main, "OUTPUTS_DIR", outputs_dir
        ):
            response = main.delete_existing_project(project["id"])

        self.assertTrue(response["deleted"])
        self.assertEqual(response["asset_count"], 1)
        self.assertEqual(response["clip_count"], 1)
        self.assertFalse(os.path.exists(asset_path))
        self.assertFalse(os.path.exists(output_path))
        database.init_db()
        self.assertNotIn(
            project["id"],
            {item["id"] for item in database.list_projects()},
        )
        self.assertIn(
            retained_project["id"],
            {item["id"] for item in database.list_projects()},
        )
        self.assertEqual(database.list_assets(project["id"]), [])
        self.assertEqual(database.list_clips(project["id"]), [])
        self.assertEqual(database.list_render_jobs(project["id"]), [])
        self.assertEqual(database.list_clip_drafts(clip["id"]), [])
        self.assertEqual(database.list_outputs(project["id"]), [])
        self.assertEqual(database.get_project_state(project["id"]), {})


if __name__ == "__main__":
    unittest.main()
