from __future__ import annotations

import io
import logging
import math
import urllib.error
import urllib.request
from concurrent import futures
from typing import Iterable, Optional, Protocol, Tuple

import numpy as np

from .proto import audio_analysis_pb2 as messages
from .proto import audio_analysis_pb2_grpc as bindings

try:
  import grpc
except ModuleNotFoundError:  # pragma: no cover - exercised via tests
  grpc = None  # type: ignore[assignment]

try:
  import librosa
except ModuleNotFoundError:  # pragma: no cover - exercised via tests
  librosa = None  # type: ignore[assignment]


LOGGER = logging.getLogger(__name__)

_NOTE_NAMES: tuple[str, ...] = (
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
)

_KRUMHANSL_MAJOR = np.array(
  [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  dtype=np.float32,
)
_KRUMHANSL_MINOR = np.array(
  [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  dtype=np.float32,
)


class _AudioLoader(Protocol):
  def __call__(self, audio_url: str) -> Tuple[np.ndarray, int]: ...


class AudioAnalysisService(bindings.AudioAnalysisServiceServicer):
  """librosa-backed implementation producing BPM and energy metrics."""

  def __init__(self, audio_loader: Optional[_AudioLoader] = None) -> None:
    if librosa is None:
      raise RuntimeError("librosa must be installed to use AudioAnalysisService.")
    self._audio_loader = audio_loader or self._load_audio

  def AnalyzeTrack(  # noqa: N802
    self,
    request: messages.AnalyzeTrackRequest,
    context: Optional[object] = None,
  ) -> messages.AnalyzeTrackResponse:
    y, sr = self._audio_loader(request.audio_url)
    summary = self._build_summary(y, sr)
    sections = list(self._build_sections(y, sr))
    return messages.AnalyzeTrackResponse(summary=summary, sections=sections)

  def _load_audio(self, audio_url: str) -> Tuple[np.ndarray, int]:
    if not audio_url:
      raise ValueError("audio_url is required for analysis")

    try:
      with urllib.request.urlopen(audio_url) as response:
        payload = response.read()
    except urllib.error.URLError as exc:  # pragma: no cover - network failure guard
      raise RuntimeError(f"failed to fetch audio payload: {exc.reason}") from exc

    buffer = io.BytesIO(payload)
    y, sr = librosa.load(buffer, sr=None, mono=True)
    LOGGER.debug(
      "Loaded audio payload",
      extra={"audio_url": audio_url, "sample_rate": sr, "frames": int(y.size)},
    )
    return y, sr

  def _build_summary(self, y: np.ndarray, sr: int) -> messages.AnalysisSummary:
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    rms = librosa.feature.rms(y=y)[0]
    energy = float(np.clip(np.mean(rms), 0.0, 1.0))
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    beat_position = self._classify_beat_position(beats)
    key = self._estimate_key(y, sr)

    return messages.AnalysisSummary(
      bpm=round(float(np.atleast_1d(tempo)[0]), 2),
      energy=round(energy, 3),
      beat_position=beat_position,
      spectral_centroid=round(centroid, 2),
      key=key,
    )

  def _classify_beat_position(self, beats: np.ndarray) -> messages.BeatPosition:
    if beats.size == 0:
      return messages.BeatPosition.BEAT_POSITION_UNSPECIFIED
    if beats.size == 1:
      return messages.BeatPosition.ON_BEAT

    intervals = np.diff(beats)
    if not intervals.size:
      return messages.BeatPosition.ON_BEAT

    variance = np.var(intervals)
    threshold = 0.25
    return (
      messages.BeatPosition.ON_BEAT
      if variance <= threshold
      else messages.BeatPosition.OFF_BEAT
    )

  def _estimate_key(self, y: np.ndarray, sr: int) -> messages.KeyEstimate:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    profile = np.mean(chroma, axis=1)
    if np.allclose(profile, 0.0):
      return messages.KeyEstimate(
        tonic="C",
        mode="major",
        confidence=0.0,
        chord_progression=["C:I", "C:IV", "C:V", "C:I"],
      )

    major_scores = self._score_key(profile, _KRUMHANSL_MAJOR)
    minor_scores = self._score_key(profile, _KRUMHANSL_MINOR)
    major_best_idx = int(np.argmax(major_scores))
    minor_best_idx = int(np.argmax(minor_scores))
    major_best = major_scores[major_best_idx]
    minor_best = minor_scores[minor_best_idx]

    if major_best >= minor_best:
      tonic = _NOTE_NAMES[major_best_idx]
      mode = "major"
      best = major_best
      alt = minor_best
    else:
      tonic = _NOTE_NAMES[minor_best_idx]
      mode = "minor"
      best = minor_best
      alt = major_best

    confidence = float(np.clip(best / (best + alt) if (best + alt) > 0 else 0.0, 0.0, 1.0))
    progression = self._build_progression(tonic, mode)

    return messages.KeyEstimate(
      tonic=tonic,
      mode=mode,
      confidence=round(confidence, 3),
      chord_progression=progression,
    )

  def _score_key(self, chroma: np.ndarray, template: np.ndarray) -> np.ndarray:
    template_norm = np.linalg.norm(template)
    chroma_norm = np.linalg.norm(chroma)
    if template_norm == 0 or chroma_norm == 0:
      return np.zeros(12, dtype=np.float32)

    normalised_template = template / template_norm
    chroma_vector = chroma / chroma_norm
    scores = np.zeros(12, dtype=np.float32)
    for shift in range(12):
      rotated_template = np.roll(normalised_template, shift)
      scores[shift] = float(np.dot(chroma_vector, rotated_template))
    return scores

  def _build_progression(self, tonic: str, mode: str) -> list[str]:
    if mode == "major":
      base = ["I", "IV", "V", "I"]
    else:
      base = ["i", "iv", "v", "i"]
    return [f"{tonic}:{symbol}" for symbol in base]

  def _build_sections(self, y: np.ndarray, sr: int) -> Iterable[messages.SectionBreakdown]:
    duration = librosa.get_duration(y=y, sr=sr)
    if math.isclose(duration, 0.0):
      yield messages.SectionBreakdown(
        label="full_track",
        start_sec=0.0,
        end_sec=0.0,
        average_energy=0.0,
      )
      return

    segment_count = max(1, min(3, int(duration // 45) + 1))
    edges = np.linspace(0.0, duration, num=segment_count + 1)
    labels = ("intro", "verse", "chorus", "bridge")

    for idx in range(segment_count):
      start = float(edges[idx])
      end = float(edges[idx + 1])
      start_idx = int(start * sr)
      end_idx = int(end * sr)
      if end_idx <= start_idx:
        end_idx = min(len(y), start_idx + sr)
      segment = y[start_idx:end_idx]
      if segment.size == 0:
        rms_value = 0.0
      else:
        rms_value = float(np.clip(np.mean(librosa.feature.rms(y=segment)[0]), 0.0, 1.0))

      yield messages.SectionBreakdown(
        label=labels[idx % len(labels)],
        start_sec=round(start, 2),
        end_sec=round(end, 2),
        average_energy=round(rms_value, 3),
      )


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
