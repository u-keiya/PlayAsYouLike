# Audio Analysis Service Skeleton

## Overview

This repository now provides a librosa-backed Python implementation for the gRPC-based audio analysis microservice defined in [`proto/audio_analysis.proto`](../../proto/audio_analysis.proto). The service downloads remote audio, extracts BPM and root-mean-square (RMS) energy, estimates the key using Krumhansl-Schmuckler profiles, and emits coarse segment energy summaries for the dynamic FX engine.

- **USDM**: US-005 動的演出
- **ADR**: ADR-0003 外部ストリーミング連携APIに gRPC を採用

## Feature Highlights

- **Tempo detection**: `librosa.beat.beat_track` yields BPM and beat intervals; beat regularity is mapped onto the proto `BeatPosition`.
- **Energy normalisation**: RMS energy (`librosa.feature.rms`) is averaged and clamped to the proto's 0-1 range so that low-volume tracks still produce meaningful values.
- **Key estimation**: averaged chroma (`librosa.feature.chroma_cqt`) is compared against Krumhansl major/minor templates to select the likely tonic/mode and produce a simple progression for downstream cues.
- **Section summaries**: track duration is partitioned into up to three labelled sections (intro/verse/chorus) with segment-level RMS averages, keeping the proto contract stable until structural segmentation spikes conclude.

## Package Layout

| Path                                         | Purpose                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `audio_svc/proto/audio_analysis_pb2.py`      | Dataclass mirror of the proto schema used until `grpcio-tools` can generate bindings in CI |
| `audio_svc/proto/audio_analysis_pb2_grpc.py` | Minimal service base class & registration helper                                           |
| `audio_svc/server.py`                        | Production analyser with librosa metrics and gRPC server factory                           |
| `tests/unit/audio_svc/test_server.py`        | Unit tests covering determinism and dependency guards                                      |

## Dependencies

- Core: `librosa` 0.10, `numpy`, `scipy`
- Audio I/O: `soundfile`, `audioread`
- RPC: `grpcio`, `grpcio-tools`, `protobuf`

## Local Development

1. Install dependencies (requires uv 0.4+):
   ```bash
   cd audio_svc
   uv sync
   ```
2. (Optional) Regenerate proto bindings:
   ```bash
   python3 -m pip install grpcio grpcio-tools protobuf
   python3 -m grpc_tools.protoc --proto_path=proto \
       --python_out=audio_svc/proto --grpc_python_out=audio_svc/proto \
       proto/audio_analysis.proto
   ```
3. Run the unit tests:
   ```bash
   uv run python -m unittest discover -s tests/unit -t .
   ```

The helper `audio_svc.build_grpc_server()` raises a descriptive `RuntimeError` when the `grpcio` dependency is missing. CI executes the same unittest invocation to ensure the analyser and dependency guards stay healthy.

## TypeScript Client Generation

- `BUF_CACHE_DIR=.buf-cache pnpm proto:generate` で `src/gen/audio/` 以下に TypeScript クライアントが再生成されます。
- フロントエンド側では `src/services/audio-analysis-client.ts` の `createAudioAnalysisClient` から gRPC-web 経由で AudioAnalysisService を呼び出せます。
