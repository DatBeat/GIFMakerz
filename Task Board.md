# Task Board

## Today
-

## This Week
- [ ] User testing in real email clients (Outlook, Gmail, Apple Mail)
- [ ] Performance benchmark: encoding < 5s for 10 frames at 600px
- [x] Replace gif.js with modern encoders — gifenc (Fast) + gifski (Quality), pluggable, toggle (053026, branch feat/modern-gif-encoder)
- [ ] Manual browser validation of new encoders: Fast vs Quality size/quality on 10-frame @600px (dev server crashed mid-session, not yet done)

## Backlog
- [ ] Undo/redo
- [ ] PWA offline support
- [ ] Historique local (IndexedDB)
- [ ] Export APNG
- [ ] Integration ESP (Mailchimp, Brevo, Klaviyo)
- [ ] Mode batch (multi-GIF generation)
- [ ] Frame duplication
- [ ] Reverse/ping-pong animation
- [ ] weightEstimator/optimizer encoder-aware: colorCount estimate + "reduce colors" suggestion only valid for Fast (gifenc); inert for Quality (gifski uses own quality score) — key off settings.encoder

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
