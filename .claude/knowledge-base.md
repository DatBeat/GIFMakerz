# Knowledge Base

System-wide learned rules. Read by ALL agents and sessions at startup.
Written ONLY by the auditor after confirming learnings.
Entries are mandatory constraints, not suggestions.

## Provenance Hierarchy
Every entry MUST cite its source using one of:
- `[Source: user override MMDDYY]` — User explicitly corrected something
- `[Source: empirical MMDDYY]` — Verified through testing or data
- `[Source: agent inference MMDDYY]` — Pattern observed by an agent, confirmed by auditor

## Hard Rules
- (none yet — rules accumulate as you work and the auditor validates learnings)

## Platform & Tool Rules
- [040926] Tailwind CSS v4 dark mode requires `@custom-variant dark (&:where(.dark, .dark *));` after `@import "tailwindcss"` — no tailwind.config.js needed. (Source: empirical 040926 — implemented and tested in browser)
- [040926] gif.js worker must be copied to `public/` as `gif.worker.js` and referenced via `workerScript: '/gif.worker.js'` in Vite projects — Vite cannot bundle gif.js workers automatically. (Source: empirical 040926 — build verified)
- [040926] Video frame extraction: use `<video>` + Canvas without FFmpeg — set `video.currentTime`, wait for `onseeked`, drawImage to canvas, toBlob → File. No extra dependencies required. (Source: empirical 040926 — implemented and tested)

## Project Patterns
- (none yet)

## Known Failure Modes
- [040926] Subagents dispatched to modify the codebase sometimes skip the git commit step — always verify commits after each subagent dispatch and commit manually if absent. (Source: empirical 040926 — dark mode subagent failed to commit, required manual commit)
