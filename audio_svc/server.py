from __future__ import annotations

import hashlib
from concurrent import futures
from typing import Iterable, Optional

from .proto import audio_analysis_pb2 as messages
from .proto import audio_analysis_pb2_grpc as bindings

try:
  import grpc
except ModuleNotFoundError:  # pragma: no cover - exercised via tests
  grpc = None  # type: ignore[assignment]


_KEY_MODE_CYCLE: tuple[tuple[str, str], ...] = (
  ("C", "major"),
  ("A", "minor"),
  ("G", "mixolydian"),
  ("E", "dorian"),
  ("D", "major"),
  ("B", "minor"),
  ("F#", "lydian"),
  ("C#", "phrygian"),
)


class AudioAnalysisService(bindings.AudioAnalysisServiceServicer):
  """Deterministic placeholder implementation for the audio analysis RPCs."""

  def AnalyzeTrack(  # noqa: N802
    self,
    request: messages.AnalyzeTrackRequest,
    context: Optional[object] = None,
  ) -> messages.AnalyzeTrackResponse:
    """Return synthetic-but-stable features derived from the audio URL."""
    summary = self._build_summary(request.audio_url)
    sections = list(self._build_sections(request.audio_url))
    return messages.AnalyzeTrackResponse(summary=summary, sections=sections)

  def _build_summary(self, audio_url: str) -> messages.AnalysisSummary:
    digest = hashlib.sha1(audio_url.encode("utf-8")).digest()
    tempo = 60.0 + (digest[0] % 161)  # 60-220 BPM range
    energy = min(1.0, round(digest[1] / 255, 3))
    centroid = 100.0 + (digest[2] / 255 * 7900.0)
    beat_position = (
      messages.BeatPosition.ON_BEAT
      if digest[3] % 2 == 0
      else messages.BeatPosition.OFF_BEAT
    )
    tonic, mode = _KEY_MODE_CYCLE[digest[4] % len(_KEY_MODE_CYCLE)]
    key = messages.KeyEstimate(
      tonic=tonic,
      mode=mode,
      confidence=round(digest[5] / 255, 3),
      chord_progression=_make_progression(digest[6]),
    )
    return messages.AnalysisSummary(
      bpm=round(tempo, 2),
      energy=energy,
      beat_position=beat_position,
      spectral_centroid=round(centroid, 2),
      key=key,
    )

  def _build_sections(self, audio_url: str) -> Iterable[messages.SectionBreakdown]:
    digest = hashlib.sha1(f"{audio_url}:sections".encode("utf-8")).digest()
    base_labels = ("intro", "verse", "chorus", "bridge")
    section_count = 3 + digest[0] % 2
    cursor = 0.0
    for idx in range(section_count):
      length = 20.0 + (digest[idx + 1] % 40)
      start = cursor
      end = start + length
      cursor = end
      yield messages.SectionBreakdown(
        label=base_labels[idx % len(base_labels)],
        start_sec=round(start, 2),
        end_sec=round(end, 2),
        average_energy=round((digest[idx + 2] % 128) / 127, 3),
      )


def _make_progression(seed: int) -> list[str]:
  chords = ("I", "ii", "iii", "IV", "V", "vi", "vii°")
  start = seed % len(chords)
  return [chords[(start + offset) % len(chords)] for offset in range(4)]


def build_grpc_server(  # noqa: D401
  servicer: Optional[AudioAnalysisService] = None,
  *,
  max_workers: int = 4,
  port: Optional[int] = None,
):
  """Instantiate a grpc.Server wired with AudioAnalysisService."""
  if grpc is None:
    raise RuntimeError("grpcio must be installed to build the audio service server.")

  server = grpc.server(futures.ThreadPoolExecutor(max_workers=max_workers))
  bindings.add_AudioAnalysisServiceServicer_to_server(
    servicer or AudioAnalysisService(),
    server,
  )
  if port is not None:
    server.add_insecure_port(f"[::]:{port}")
  return server
