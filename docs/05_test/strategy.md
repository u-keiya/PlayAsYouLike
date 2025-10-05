# Test Strategy

## 1. Overview

This document outlines the testing strategy for the "PlayAsYouLike" project. Our goal is to ensure high quality and reliability by employing a multi-layered testing approach, inspired by the "Test Pyramid" concept. Each layer has a distinct purpose, from fast, isolated unit tests to comprehensive end-to-end user scenario validations.

## 2. Test Layers

| Layer | Tool / Framework | Location | Purpose |
| :--- | :--- | :--- | :--- |
| **Acceptance (E2E)** | Gherkin (Cucumber/Behave) | `tests/e2e/` | **Validate user requirements (USDM)**. Simulates user behavior from the outside-in, ensuring the system delivers the expected value. |
| **Contract** | Schemathesis, Pytest | `tests/contract/` | **Verify API contracts**. Automatically validates that the API implementation adheres to the `openapi.yaml` specification, including WebSocket message schemas. |
| **Integration** | Pytest | `tests/integration/` | Test interactions between components (e.g., API server and database, service to service, **WebSocket communication**). |
| **Unit** | Pytest | `tests/unit/` | Test individual functions, methods, or classes in isolation. Fast feedback for developers. |

## 3. Coverage Targets

Our initial coverage goals are as follows. These will be measured and reported via our CI pipeline.

- **USDM Acceptance Criteria Coverage**: 100%
  - Every leaf-node requirement in `docs/02_requirements/usdm/` must have at least one corresponding Gherkin scenario in `tests/e2e/`.
- **API Contract Coverage**: 100%
  - All HTTP endpoints and methods defined in `openapi.yaml` will be tested by Schemathesis.
  - All WebSocket message schemas (e.g., `EffectPresetMessage`) will be validated via dedicated contract tests.
- **Code Coverage (Unit & Integration)**: > 80%
  - This is a target for the development team to maintain.

## 4. CI/CD Integration

All tests will be executed automatically on every pull request to the `develop` and `main` branches. A pull request cannot be merged unless all tests pass.

- **Linting**: Code style and quality checks.
- **Unit/Integration Tests**: Fast feedback loop.
- **Contract Tests**: Ensure API integrity.
- **Acceptance Tests**: Validate end-to-end functionality.

## 5. WebSocket Testing

Our strategy for testing WebSocket endpoints combines **contract testing** for message integrity and **integration testing** for interaction flows.

- **Contract Tests (`tests/contract/test_websocket_contract.py`)**:
  - These tests are now **active** in the CI pipeline.
  - They validate that all WebSocket messages (`PlayerInput`, `HitResult`, `Warning`, `EffectPresetMessage`) strictly adhere to the `openapi.yaml` schemas.
  - The test for `EffectPresetMessage` correctly interprets the `discriminator` to enforce per-preset parameter requirements.
- **Integration Tests (`tests/integration/test_websocket_interaction.py`)**:
  - A new test layer to verify the request/response correlation.
  - For example, it ensures that when a `PlayerInput` is sent to `/ws/hit-judge`, a valid `HitResult` or `Warning` is received in response.

These tests require a running WebSocket server (or a mock equivalent) to be executed in the CI pipeline.

## 6. Open Questions

- **CI Setup for WebSocket Tests**: How should the test WebSocket server be managed in the CI environment (e.g., via Docker Compose, a background process, or a mock server library) to ensure these new contract and integration tests run reliably?