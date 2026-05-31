# Task Board

## Today
-

## This Week
- [ ] User testing in real email clients (Outlook, Gmail, Apple Mail)
- [ ] Performance benchmark: encoding < 5s for 10 frames at 600px
- [x] Replace gif.js with modern encoders — gifenc (Fast) + gifski (Quality), pluggable, toggle (053026)
- [x] Browser-validated new encoders: countdown 6f@600px → Fast 11KB / Quality 16KB (gifski wins on photo content, not flat colors) (053026)
- [x] weightEstimator/optimizer encoder-aware — estimate reacts to encoder toggle, optimizer skips color-reduction for Quality (053026)
- [x] Animate transitions in the preview (crossfade/slide rendered, source-frame counter, accurate duration) (053026)
- [x] Per-frame image fit editor — fill/contain/cover/tile + manual zoom/pan, contain bg color/blur, default cover, shared drawImageWithFit renderer (preview = output); browser-validated (053126)

## Backlog
- [ ] Remove now-unused `drawImageToCanvas` (legacy stretch) — superseded by drawImageWithFit
- [ ] FrameFitEditor: a11y (role=dialog, focus trap, Escape) — currently backdrop-click/Annuler only
- [ ] Undo/redo
- [ ] PWA offline support
- [ ] Historique local (IndexedDB)
- [ ] Export APNG
- [ ] Integration ESP (Mailchimp, Brevo, Klaviyo)
- [ ] Mode batch (multi-GIF generation)
- [ ] Frame duplication
- [ ] Reverse/ping-pong animation

## Done
- [x] Setup projet Vite + React + TS + Tailwind (040926)
- [x] MVP complet: upload, reorder, paramètres, presets, preview, encodage, download (040926)
- [x] Dark mode light/dark/system (040926)
- [x] Clipboard paste Ctrl+V (040926)
- [x] Per-frame duration control (040926)
- [x] Copy HTML `<img>` snippet (040926)
- [x] Email client preview Outlook/Gmail (040926)
- [x] Smart auto-optimization (040926)
- [x] Video → GIF import (040926)
- [x] Text overlay on frames (040926)
- [x] Template gallery (countdown, avant/après, flash sale, carrousel) (040926)
