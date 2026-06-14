# NE Prep Workspace

This repository now serves as the single parent workspace for the study and exam materials in `dsa`, `java`, `mobile`, `restfull`, and `robotic`.

## Structure

- `dsa/` data structures and algorithms notes, templates, examples, and assessments
- `java/` Java exam work and starter templates
- `mobile/` mobile app practicals and templates
- `restfull/` REST and microservice practical work
- `robotic/` robotics and computer-vision projects

## Repository Rules

- Keep real secrets in local `.env` files only.
- Commit `.env.example` files with placeholder values.
- Do not commit `node_modules`, `target`, `dist`, virtual environments, or generated executables.
- Keep helpful project instructions in local `README.md`, `AGENTS.md`, and related docs when they matter to future work.

## Typical Setup

1. Open the project folder you need.
2. Copy `.env.example` to `.env` where required.
3. Install that project's dependencies locally.
4. Build or run from that project directory.

This keeps the parent repo usable as one archive of the full workspace without mixing in secrets or local build outputs.
