# GIF Maker for Email Marketing — Design Spec

**Source:** `PRD_GIF_Email_Marketing_Tool.md` (adopted as-is per user instruction)

## Summary

100% client-side React web app for creating optimized GIF animations for email marketing. Users upload images, reorder frames, configure animation parameters (with email marketing presets), preview in real-time on Canvas, encode via gif.js Web Workers, and download the result.

## Architecture

- **Frontend only** — no backend, no data leaves the browser
- **State:** Zustand store holds frames, settings, generation state
- **Encoding:** gif.js with Web Workers for non-blocking GIF generation
- **Preview:** Canvas API animation loop (not re-encoding on each change)
- **Upload:** react-dropzone for drag & drop
- **Reorder:** @dnd-kit/core + @dnd-kit/sortable
- **Styling:** Tailwind CSS v4 via @tailwindcss/vite

## Key Decisions

1. Weight estimation uses heuristic formula `width × height × frames × qualityFactor × compression` — not actual encoding
2. Transitions (crossfade/slide) generate intermediate Canvas frames before encoding
3. gif.worker.js is served from public/ directory
4. All processing happens in browser — deployable to any static host

## DoD (from PRD §8)

12 acceptance criteria — see PRD for full list.
