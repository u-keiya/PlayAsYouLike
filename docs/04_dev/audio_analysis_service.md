# Audio Analysis Service Skeleton

## Overview

This repository now provides a lightweight Python scaffold for the gRPC-based audio analysis microservice defined in [`proto/audio_analysis.proto`](../../proto/audio_analysis.proto). The service currently returns deterministic placeholder metrics derived from the request URL so that downstream components can be integrated before the realtime analyser is available.

- **USDM**: US-005 動的演出
- **ADR**: ADR-0003 外部ストリーミング連携APIに gRPC を採用

## Package Layout

| Path                                         | Purpose                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `audio_svc/proto/audio_analysis_pb2.py`      | Dataclass mirror of the proto schema used until `grpcio-tools` can generate bindings in CI |
| `audio_svc/proto/audio_analysis_pb2_grpc.py` | Minimal service base class & registration helper                                           |
| `audio_svc/server.py`                        | Deterministic placeholder implementation and gRPC server factory                           |
| `tests/unit/audio_svc/test_server.py`        | Unit tests covering determinism and dependency guards                                      |

## Local Development

1. (Optional) Install the real gRPC runtime for manual testing:
   ```bash
   python3 -m pip install grpcio grpcio-tools protobuf
   python3 -m grpc_tools.protoc --proto_path=proto \
       --python_out=audio_svc/proto --grpc_python_out=audio_svc/proto \
       proto/audio_analysis.proto
   ```
2. Run the unit tests:
   ```bash
   python3 -m unittest discover -s tests/unit -t .
   ```

The helper `audio_svc.build_grpc_server()` raises a descriptive `RuntimeError` when the `grpcio` dependency is missing. CI executes the same unittest invocation to ensure the scaffold stays healthy.
