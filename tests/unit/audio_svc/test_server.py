import unittest

from audio_svc import AudioAnalysisService, build_grpc_server
from audio_svc.proto import AnalyzeTrackRequest, BeatPosition


class AudioAnalysisServiceTests(unittest.TestCase):
  def setUp(self) -> None:
    self.service = AudioAnalysisService()
    self.sample_url = "https://cdn.playasul.local/audio/sample-song.mp3"

  def test_analyze_track_is_deterministic(self) -> None:
    request = AnalyzeTrackRequest(audio_url=self.sample_url, session_id="S123")
    first = self.service.AnalyzeTrack(request)  # noqa: N802
    second = self.service.AnalyzeTrack(request)  # noqa: N802
    self.assertEqual(first.summary, second.summary)
    self.assertEqual(first.sections, second.sections)

  def test_analyze_track_changes_with_url(self) -> None:
    request_a = AnalyzeTrackRequest(audio_url=self.sample_url)
    request_b = AnalyzeTrackRequest(audio_url=f"{self.sample_url}?v=2")

    result_a = self.service.AnalyzeTrack(request_a)  # noqa: N802
    result_b = self.service.AnalyzeTrack(request_b)  # noqa: N802

    self.assertNotEqual(result_a.summary.bpm, result_b.summary.bpm)
    self.assertIn(result_a.summary.beat_position, list(BeatPosition))

  def test_build_grpc_server_requires_grpc_dependency(self) -> None:
    with self.assertRaisesRegex(RuntimeError, "grpcio must be installed"):
      # Without grpcio the helper should raise a descriptive error.
      build_grpc_server(self.service, port=50051)


if __name__ == "__main__":
  unittest.main()
