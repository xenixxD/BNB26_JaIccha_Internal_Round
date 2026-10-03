import unittest
from unittest.mock import patch

from server import semantic_matcher


class SemanticMatcherTests(unittest.TestCase):
    def test_matching_returns_explainable_ranked_candidate_from_local_embeddings(self):
        transcript_segments = [
            {
                "start": 0.0,
                "end": 18.0,
                "text": "Creators build useful videos by planning a clear script.",
            }
        ]
        with patch.object(
            semantic_matcher,
            "_embed",
            return_value=[[1.0, 0.0], [1.0, 0.0]],
        ) as embed:
            candidates = semantic_matcher.match_script_to_transcript(
                script_text="Creators build useful videos",
                transcript_segments=transcript_segments,
                project_id="project-1",
                source_asset_id="asset-1",
                script_version_id="version-1",
                transcript_id="transcript-1",
            )

        embed.assert_called_once()
        self.assertEqual(len(candidates), 1)
        candidate = candidates[0]
        self.assertEqual(candidate["start_time"], 0.0)
        self.assertEqual(candidate["end_time"], 18.0)
        self.assertEqual(candidate["semantic_score"], 100.0)
        self.assertEqual(candidate["completeness_score"], 100.0)
        self.assertEqual(candidate["duration_score"], 100.0)
        self.assertEqual(candidate["final_score"], 100.0)
        self.assertEqual(candidate["script_version_id"], "version-1")
        self.assertEqual(len(candidate["reasons"]), 3)

    def test_low_semantic_similarity_does_not_create_candidates(self):
        with patch.object(
            semantic_matcher,
            "_embed",
            return_value=[[1.0, 0.0], [0.0, 1.0]],
        ):
            candidates = semantic_matcher.match_script_to_transcript(
                script_text="A creator explains editing",
                transcript_segments=[
                    {"start": 0.0, "end": 20.0, "text": "Rain fell on the city street."}
                ],
                project_id="project-1",
                source_asset_id="asset-1",
                script_version_id="version-1",
                transcript_id="transcript-1",
            )

        self.assertEqual(candidates, [])


if __name__ == "__main__":
    unittest.main()
