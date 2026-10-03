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
        with patch.object(main, "ASSETS_DIR", assets_dir), patch.object(
            main, "transcribe_media_file", return_value=provider_result
        ) as transcribe:
            first = main.api_transcribe_asset(asset["id"])
            second = main.api_transcribe_asset(asset["id"])
            matched = main.api_script_match(main.ScriptMatchRequest(
                asset_id=asset["id"],
                script_text="Words spoken in the uploaded media.",
            ))
            unmatched = main.api_script_match(main.ScriptMatchRequest(
                asset_id=asset["id"],
                script_text="Unrelated astronomy vocabulary.",
            ))

        transcribe.assert_called_once()
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(second["segments"][0]["start"], 0)
        self.assertEqual(matched.transcript_id, first["id"])
        self.assertEqual(len(matched.matches), 1)
        self.assertEqual(matched.matches[0].start_time, 0)
        self.assertEqual(unmatched.matches, [])

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
        self.assertEqual(database.list_clip_drafts(clip["id"]), [])
        self.assertEqual(database.list_outputs(project["id"]), [])
        self.assertEqual(database.get_project_state(project["id"]), {})


if __name__ == "__main__":
    unittest.main()
