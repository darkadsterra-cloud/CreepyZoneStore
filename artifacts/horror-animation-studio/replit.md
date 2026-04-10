# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Horror Animation Studio

The main artifact is a **Horror Animation Studio** — a browser-based tool for creating animated horror overlays for livestreams.

### Features
- **Bulk Image Upload**: Drag & drop or click to upload multiple images at once
- **8 Horror Animations**: Ghostly Float, Demonic Shake, Jump Scare, Haunting Fade, Glitch Horror, Creeping Shadow, Blood Pulse, Light Flicker
- **16 Horror Sounds**: Ambient drones, sound effects, music, and voices generated with Web Audio API
- **Green Screen Mode**: Toggle green background for chroma key compositing in OBS/streaming software
- **Resolution Presets**: Full HD (1080p), 2K, 4K, Ultrawide, Square, Vertical
- **Image Transform Controls**: Position, scale, rotation, opacity per image
- **Recording**: Record animations as WebM video files
- **Download**: Export current frame as PNG

### Tech
- React + Vite frontend-only (no backend needed)
- CSS keyframe animations for all horror effects
- Web Audio API for synthesized horror sounds
- html2canvas for frame capture
- MediaRecorder API for video recording

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
