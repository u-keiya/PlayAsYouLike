"""Minimal gRPC binding helpers for the audio analysis service.

When grpcio is unavailable these helpers raise informative errors so that the
service scaffold can still be imported and unit-tested.
"""

from __future__ import annotations

from typing import Any

try:
  import grpc
except ModuleNotFoundError:  # pragma: no cover - exercised via unit tests
  grpc = None  # type: ignore[assignment]


SERVICE_FQN = "playasul.audio.v1.AudioAnalysisService"


class AudioAnalysisServiceServicer:
  """Base class mirroring generated gRPC service interface."""

  def AnalyzeTrack(self, request, context: Any | None = None):  # noqa: N802
    raise NotImplementedError("AnalyzeTrack must be implemented by subclasses.")


def add_AudioAnalysisServiceServicer_to_server(  # noqa: N802
  servicer: AudioAnalysisServiceServicer,
  server: Any,
) -> None:
  """Register the service implementation with a grpc.Server instance."""
  if grpc is None:
    raise RuntimeError("grpcio is required to register AudioAnalysisService.")

  rpc_method_handlers = {
    "AnalyzeTrack": grpc.unary_unary_rpc_method_handler(
      servicer.AnalyzeTrack,
    ),
  }
  generic_handler = grpc.method_handlers_generic_handler(
    SERVICE_FQN,
    rpc_method_handlers,
  )
  server.add_generic_rpc_handlers((generic_handler,))
