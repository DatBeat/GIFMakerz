# Memory

## Now
- GIF Maker for Email Marketing — MVP + Quick Wins complete
- 15 commits, 26 tests passing, production build clean
- 9 Quick Win features implemented (dark mode, clipboard paste, per-frame duration, HTML snippet, email preview, smart optimizer, video import, text overlay, templates)
- Ready for user testing and V2 planning

## Open Threads
- gif.js is unmaintained (2016) — consider FFmpeg.wasm or modern encoder for V2
- Video import uses Canvas-based extraction (no FFmpeg) — limited codec support

## Recent Decisions
- [040926] Followed PRD exactly as spec (no brainstorming alternatives)
- [040926] Used subagent-driven development for MVP implementation
- [040926] Tailwind v4 with @custom-variant dark for class-based dark mode
- [040926] No FFmpeg.wasm — used <video>+Canvas for video frame extraction
- [040926] Text overlays on transitions: applied to source canvases before transition generation

## Blockers
- (none)
