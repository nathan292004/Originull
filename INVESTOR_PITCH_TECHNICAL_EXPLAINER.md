# CAD Studio (CADAM) - Investor Technical Explainer

## 1) Executive Summary

CAD Studio is an AI-native, browser-based CAD product that turns natural language into editable, parametric 3D models in minutes. Instead of forcing users to learn complex CAD software first, the system lets users describe what they want, generates manufacturable OpenSCAD code, renders a live 3D preview in-browser, and enables instant refinements through chat and sliders.

The product combines:

- a modern React frontend for conversational design,
- Supabase for persistent data/auth/storage,
- multi-provider AI orchestration (OpenAI, Gemini, Anthropic) for generation,
- and OpenSCAD WebAssembly for local compile and export.

This architecture creates a strong wedge: "text-to-parametric-CAD with fast iterative control," not just one-shot mesh generation.

---

## 2) Problem and Why Now

### Core Problem

Traditional CAD tools are powerful but hard to learn. For hobbyists, founders, and teams that need quick prototypes, CAD complexity creates a time bottleneck.

### Why This Is Timely

- Foundation models are now good enough to generate structured CAD code.
- Browser/WebAssembly performance enables local CAD compilation and preview.
- Cloud backends and edge functions make interactive AI workflows practical.

CAD Studio sits at the intersection of AI usability and practical digital fabrication.

---

## 3) Product Experience (User Journey)

1. User opens app and starts a new creation with plain-English prompt.
2. Backend creates/updates conversation and sends prompt to selected model.
3. AI returns tool-driven response containing a parametric OpenSCAD artifact.
4. Frontend compiles OpenSCAD via WASM and displays interactive 3D preview.
5. User iterates:
   - by chat ("make holes larger"), or
   - by sliders/input controls (parameter-only edits, no full regeneration needed).
6. User exports `.stl` for printing or `.scad` for CAD handoff.

Net effect: idea-to-model loop happens in one interface, with no desktop install.

---

## 4) System Architecture Overview

## Frontend

- Stack: React + TypeScript + Vite.
- Core surfaces:
  - Prompt capture and conversation management,
  - Chat timeline with streaming assistant updates,
  - 3D viewer and parameter panel,
  - export controls.
- Key behavior:
  - model selection and routing metadata are preserved per message,
  - optimistic updates keep interaction responsive.

## Backend (Supabase)

- Postgres stores conversations/messages/artifacts.
- Row-level security policies protect user data boundaries.
- Edge Functions power AI workflows:
  - `chat`: primary generation and tool orchestration,
  - `title-generator`: auto-generated thread names,
  - `prompt-generator`: prompt enhancement support.
- Storage bucket supports uploaded reference images.

## AI Orchestration

- Model routing supports provider-prefixed model IDs.
- Provider-specific handling exists for:
  - request payload formats,
  - streaming formats,
  - tool/function call schemas.
- This abstraction allows quality/cost tuning by model without rewriting product logic.

## CAD Compute Layer

- OpenSCAD runs in WebAssembly inside a worker.
- Generated code compiles client-side for low-latency visual feedback.
- Mesh artifacts are loaded into Three.js for interactive viewport rendering.

---

## 5) Technical Differentiators (Defensible Product Mechanics)

### A) Parametric-First Output

The system does not stop at "generate a shape." It extracts and maintains editable parameters from code, enabling dimension-level control as a first-class UX.

### B) Fast Iteration Path Without Full Regeneration

Parameter slider changes can patch existing code and recompile locally, reducing token cost and response time while improving control.

### C) Multi-Provider AI Runtime

Provider abstraction supports OpenAI/Gemini/Anthropic with model-level routing. This de-risks vendor dependence and enables margin optimization over time.

### D) Tool-Oriented CAD Agent Behavior

The chat agent is guided to use structured tools/artifacts rather than dumping free-form text/code, improving consistency and downstream parseability.

### E) Conversation Branching Model

Conversation tree support enables controlled experimentation and revisions without losing prior paths, which is valuable for design workflows.

---

## 6) Data Model and Trust Posture

- Conversations and messages are persisted with user ownership controls.
- Supabase auth/session model underpins API access.
- Storage policies isolate user file paths.
- Architecture is compatible with enterprise controls (audit logging, org-level permissions, scoped project spaces) as a next step.

---

## 7) Business Value by Customer Segment

### Makers / Hobbyists

- Faster path from idea to printable model.
- Lower learning burden than traditional CAD.

### Hardware Startups

- Speeds early-stage prototyping cycles.
- Reduces dependence on specialist CAD bandwidth for first drafts.

### Engineering Teams

- Useful for quick concept generation and variant testing.
- Branching and parameterization support iterative design reviews.

### Education

- Natural language reduces onboarding friction for students.

---

## 8) Unit Economics Levers

Primary cost drivers:

- AI inference (tokens),
- cloud/storage,
- optional analytics and monitoring.

Margin improvement levers built into architecture:

- dynamic model routing by task complexity,
- local parameter edits (fewer full AI calls),
- prompt/tool optimization to reduce retries.

---

## 9) Go-To-Market Narrative

Initial wedge:

- "Text-to-parametric CAD for 3D printing and rapid prototyping."

Expansion:

- templates and reusable parameterized component libraries,
- collaboration/sharing workflows,
- team/enterprise deployment and governance,
- API/embedded CAD copilot in other product workflows.

---

## 10) Risks and Mitigations

### Model quality variance

Mitigation: provider-agnostic routing and model benchmarking pipelines.

### CAD correctness / manufacturability

Mitigation: stricter validation prompts, rule checks, and iterative feedback loops.

### Provider/API changes

Mitigation: centralized edge orchestration layer for quick compatibility patches.

### User trust and reliability

Mitigation: deterministic local rendering path, persistent history, explicit exports.

---

## 11) Why This Can Become a Category Company

CAD Studio is not "chat with a model." It is a vertically integrated AI design environment where:

- language intent becomes structured parametric code,
- code becomes immediate visual output in-browser,
- output remains editable, exportable, and repeatable.

The compounding moat comes from:

- interaction data and workflow understanding,
- better tool prompts and parameter extraction quality,
- faster edit loops and lower per-iteration cost,
- and product depth around design iteration, not one-shot generation.

---

## 12) Snapshot of Current Technical Foundation

Current codebase already includes:

- full-stack conversational CAD workflow,
- Supabase-backed persistence/auth/storage,
- multi-provider model integration,
- streaming response handling,
- local WASM compile/render,
- parameter extraction and edit pipeline,
- and STL/SCAD export.

This is a strong base for scaling from an advanced prosumer tool into team and enterprise design workflows.
