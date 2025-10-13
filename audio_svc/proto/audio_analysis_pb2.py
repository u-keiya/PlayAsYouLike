"""Lightweight dataclass mirrors of audio_analysis.proto structures.

These placeholders unblock service scaffolding without requiring the
google.protobuf runtime. Once `grpcio-tools` is available in the toolchain,
replace this module with generated code.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum
from typing import List, Optional


class BeatPosition(IntEnum):
  """Beat position classification matching proto enum semantics."""

  BEAT_POSITION_UNSPECIFIED = 0
  ON_BEAT = 1
  OFF_BEAT = 2


@dataclass(slots=True)
class KeyEstimate:
  tonic: str = ""
  mode: str = ""
  confidence: float = 0.0
  chord_progression: List[str] = field(default_factory=list)


@dataclass(slots=True)
class AnalysisSummary:
  bpm: float = 0.0
  energy: float = 0.0
  beat_position: BeatPosition = BeatPosition.BEAT_POSITION_UNSPECIFIED
  spectral_centroid: float = 0.0
  key: KeyEstimate = field(default_factory=KeyEstimate)


@dataclass(slots=True)
class SectionBreakdown:
  label: str = ""
  start_sec: float = 0.0
  end_sec: float = 0.0
  average_energy: float = 0.0


@dataclass(slots=True)
class AnalyzeTrackRequest:
  audio_url: str = ""
  session_id: Optional[str] = None


@dataclass(slots=True)
class AnalyzeTrackResponse:
  summary: AnalysisSummary = field(default_factory=AnalysisSummary)
  sections: List[SectionBreakdown] = field(default_factory=list)
