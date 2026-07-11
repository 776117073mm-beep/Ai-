# Video Engine Architecture

## Overview

The video engine is organized as a modular domain layer that sits behind the UI and exposes a unified command and event interface. The UI never communicates directly with backend engines. Instead, it emits commands and observes events.

## Core Modules

- Project Manager: owns project documents and project metadata.
- Media Manager: manages imported assets, proxies, and cache references.
- Timeline Engine: models sequences, tracks, markers, regions, and timeline states.
- Sequence Engine: handles nested sequences, compounds, and adjustment layers.
- Track Engine: manages video and audio tracks, locking, muting, solo, and track state.
- Clip Engine: owns clip metadata and editing operations.
- Transition Engine: hosts transition definitions and transition application.
- Effect Engine: hosts effect definitions and effect application.
- Keyframe Engine: stores and edits keyframe values.
- Audio Engine: manages audio tracks, mixing, automation, and monitoring state.
- Playback Engine: controls preview playback, speeds, loop, frame stepping, and proxy playback.
- Render Queue: prepares export jobs and cloud render orchestration.
- Cache Manager: manages cache access and invalidation.
- Proxy Manager: creates and switches proxy assets.
- Undo/Redo Manager: replays commands in history.
- History Manager: tracks command history and future state.
- Selection Manager: tracks selection of clips, tracks, and time ranges.
- Metadata Manager: stores file metadata, scene descriptors, and engine context.
- Plugin Manager: hosts engine extensions and third-party effects.
- Export Manager: handles output profiles and export configuration.
- Import Manager: imports assets and registers media in the project.
- Asset Manager: catalogs media assets and relationships.
- Workspace Manager: persists panel layout and editor state.
- Command System: centralizes editing operations and supports mouse, keyboard, touch, AI, and API execution.
- Event Bus: publishes editor lifecycle and engine lifecycle updates.

## Timeline Capabilities

The timeline model is designed for:

- Unlimited video/audio tracks
- Nested sequences
- Adjustment layers
- Compound clips
- Markers and regions
- Track locking, muting, and solo
- Ripple editing, rolling edit, slip edit, slide edit
- Magnetic snapping and frame-accurate editing
- Timeline zoom, virtualization, caching, and serialization support

## Project Format Intent

The project document is structured to hold:

- Media assets
- Timeline data
- Sequences
- Effects and transitions
- Keyframes
- Text layers
- Audio tracks
- AI history
- Cloud sync state
- Future 3D objects, motion graphics, and animation data

## Playback Strategy

Playback is planned around:

- GPU rendering and preview pipeline
- Background decoding
- Frame cache and proxy playback
- Variable speed and frame stepping
- Looping and background rendering
- Future HDR support

## Adapter Strategy

The UI interacts with a unified engine interface. The underlying adapters for FFmpeg, MLT, OpenTimelineIO, and OpenFX expose the same capabilities through their own implementations.
