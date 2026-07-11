# AI Creative Studio Architecture

## Overview

This repository establishes a modular monorepo foundation for an AI-powered creative platform. The platform is designed to support multiple independent creative engines, shared AI orchestration, cloud services, and a consistent user experience.

## Core Principles

- Clean architecture with dependency inversion.
- Feature-based package boundaries.
- Strong TypeScript typing and explicit contracts.
- Engine adapters to decouple core services from implementation details.
- Shared domain abstractions for AI, workflows, and cloud execution.

## Suggested Monorepo Structure

- apps/web: web application shell and main experience.
- packages/ui: design system and workspace experiences.
- packages/shared/ai-core: AI orchestration and engine contracts.
- packages/shared/workflow: workflow definitions and orchestration primitives.

## Engine Strategy

Each creative engine is designed as a self-contained application boundary that can later include its own runtime, rendering pipeline, and domain-specific capabilities. The core platform only knows about engine contracts.

### Video Engine Adapters

The first engine uses adapters for:

- FFmpeg
- MLT
- OpenTimelineIO
- OpenFX

Future adapters can be introduced without changing the engine contract.

## Future Expansion Points

- Add engine-specific packages under packages/engines/*.
- Introduce cloud execution providers and runtime modes.
- Add billing, auth, project storage, and collaboration services.
- Add more AI agents and workflow steps.
