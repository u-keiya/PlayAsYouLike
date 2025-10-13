import unittest
from unittest import mock

import numpy as np

try:
  import librosa
except ModuleNotFoundError:  # pragma: no cover - environment guard
  librosa = None  # type: ignore[assignment]

from audio_svc import AudioAnalysisService, build_grpc_server
from audio_svc.proto import AnalyzeTrackRequest, BeatPosition


class AudioAnalysisServiceTests(unittest.TestCase):
  def setUp(self) -> None:
    if librosa is None:
      self.skipTest("librosa is required for AudioAnalysisService tests")

    self.sample_url = "memory://synthetic"
    self.sr = 22050
    tempo_bpm = 120
    duration = 4.0
    beat_interval = 60 / tempo_bpm
    beat_times = np.arange(0, duration, beat_interval)
    clicks = librosa.clicks(times=beat_times, sr=self.sr, length=int(duration * self.sr))
    tone = 0.3 * np.sin(2 * np.pi * 220 * np.linspace(0, duration, int(duration * self.sr), endpoint=False))
    waveform = clicks + tone
    max_val = np.max(np.abs(waveform))
    self.waveform = waveform / max_val if max_val > 0 else waveform
    self.request = AnalyzeTrackRequest(audio_url=self.sample_url, session_id="S123")
    self.loader = lambda url: (self.waveform, self.sr)
    self.service = AudioAnalysisService(audio_loader=self.loader)

  def test_analyze_track_estimates_bpm_and_energy(self) -> None:
    response = self.service.AnalyzeTrack(self.request)  # noqa: N802
    summary = response.summary

    self.assertAlmostEqual(summary.bpm, 120.0, delta=3.0)
    expected_energy = float(np.clip(np.mean(librosa.feature.rms(y=self.waveform)[0]), 0.0, 1.0))
    self.assertAlmostEqual(summary.energy, expected_energy, delta=0.05)
    self.assertIn(summary.beat_position, (BeatPosition.ON_BEAT, BeatPosition.BEAT_POSITION_UNSPECIFIED))

  def test_sections_cover_entire_track(self) -> None:
    response = self.service.AnalyzeTrack(self.request)  # noqa: N802
    sections = response.sections
    self.assertGreaterEqual(len(sections), 1)
    total_duration = sections[-1].end_sec - sections[0].start_sec
    self.assertGreater(total_duration, 0.0)
    for section in sections:
      self.assertGreaterEqual(section.average_energy, 0.0)

  def test_build_grpc_server_requires_grpc_dependency(self) -> None:
    with mock.patch("audio_svc.server.grpc", None):
      with self.assertRaisesRegex(RuntimeError, "grpcio must be installed"):
        build_grpc_server(self.service, port=50051)

  def test_build_grpc_server_creates_server_when_available(self) -> None:
    server = build_grpc_server(self.service)
    try:
      self.assertIsNotNone(server)
    finally:
      server.stop(grace=None)


if __name__ == "__main__":
  unittest.main()
