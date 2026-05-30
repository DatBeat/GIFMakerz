# Remplacement de l'encodeur GIF — Design

**Date :** 2026-05-30
**Statut :** Validé (en attente de revue spec)
**Objectif :** Remplacer gif.js (non maintenu depuis 2016) par des encodeurs modernes optimisés pour la **meilleure qualité visuelle au plus petit poids**, pour l'envoi de GIFs dans des newsletters et emails.

## Contexte

L'app produit des GIFs animés à partir d'images, pour l'email marketing. L'encodage actuel repose sur `gif.js` (NeuQuant, workers), qui produit des fichiers lourds et est lent. Le code d'encodage est isolé dans `src/utils/gifEncoder.ts`, exposant `encodeGif()` qui retourne `EncodeResult { blob, metadata }`. L'amont (transitions, text overlays, redimensionnement canvas) est déjà construit avant l'appel à gif.js.

## Décision

Architecture **encodeur pluggable** avec **deux** encodeurs :

1. **Fast (gifenc)** — moderne, léger (~Ko), rapide. Mode preview / itération.
2. **Quality (gifski via gifski-wasm)** — meilleur ratio qualité/poids du marché (palettes par-frame, dithering haute qualité, optimisation temporelle). Mode livrable email final, **défaut**.

gif.js est **supprimé entièrement** : dépendance npm, `public/gif.worker.js`, `src/gif.js.d.ts`. Pas de mode "legacy".

### Classement des encodeurs (justification)

- 🥇 **gifski** — conçu pour qualité/poids, match exact de l'objectif produit.
- 🥈 **gifenc** — meilleur compromis sans wasm lourd, rapide, bon rendu.
- 🥉 FFmpeg.wasm — excellent mais bundle ~25 Mo + headers SharedArrayBuffer, surdimensionné pour un outil client-side. **Écarté.**

## Architecture

Split de `gifEncoder.ts` en deux responsabilités :

- **`buildFrames()`** — conserve toute la logique amont (transitions, text overlays, canvas, resize). Retourne `{ canvas: HTMLCanvasElement; delay: number }[]`. Comportement inchangé.
- **`encoders/`** — chaque encodeur implémente une interface commune.

```ts
interface EncodeOpts {
  width: number;
  height: number;
  repeat: number;        // 0 = infini, n = nombre de boucles
  colorCount: number;    // max couleurs palette
  quality: Quality;      // 'low' | 'medium' | 'high'
  dithering: DitherMethod;
  encodingSpeed: number;
}

interface Encoder {
  id: 'fast' | 'quality';
  encode(
    frames: { canvas: HTMLCanvasElement; delay: number }[],
    opts: EncodeOpts,
    onProgress: (p: number) => void
  ): Promise<Blob>;
}
```

`encodeGif()` devient l'orchestrateur :
1. `buildFrames(imageUrls, settings, frameDurations, frameTextOverlays)` → frames.
2. `registry[settings.encoder].encode(frames, opts, onProgress)` → `Blob`.
3. Calcul `GifMetadata` (identique à aujourd'hui) → `EncodeResult`.

Le reste de l'app (`GenerateButton`, store zustand, `DownloadPanel`) ne change pas : l'interface `encodeGif()` et `EncodeResult` sont préservées.

### Nouveaux fichiers

- `src/utils/encoders/index.ts` — registry `{ fast, quality }`, types `Encoder` / `EncodeOpts`.
- `src/utils/encoders/gifenc.ts` — implémentation Fast.
- `src/utils/encoders/gifski.ts` — implémentation Quality.

### Fichiers modifiés

- `src/utils/gifEncoder.ts` — orchestrateur + extraction de `buildFrames()`.
- `src/types.ts` — ajout `encoder` à `GifSettings`.
- Panneau settings (composant UI) — toggle encodeur.
- `package.json` — retrait `gif.js`, ajout `gifenc` et `gifski-wasm` (noms exacts à vérifier au build).

### Fichiers supprimés

- `public/gif.worker.js`
- `src/gif.js.d.ts`

## Les deux encodeurs

| | Fast (gifenc) | Quality (gifski) |
|---|---|---|
| Usage | preview / itération | livrable email final |
| Palette | globale ou par-frame, `colorCount` respecté | 256, optimisée par gifski |
| Dithering | basique / nearest (limité) | natif haute qualité |
| Vitesse | très rapide, main thread | plus lent, wasm |
| Sortie | légère | la plus légère à qualité égale |

**Nuance assumée :** le dithering de gifenc est inférieur à celui de gif.js. Le dithering haute qualité vit dans gifski. C'est cohérent avec le split fast/quality : le mode rapide privilégie la vitesse, le mode qualité le rendu.

## Types & UI

- `GifSettings.encoder: 'fast' | 'quality'`, défaut `'quality'`.
- Toggle dans le panneau settings : « Rapide (preview) » / « Qualité max (email) ».
- Mapping des paramètres existants :
  - gifenc : `colorCount` → nombre de couleurs ; `quality`/`dithering`/`encodingSpeed` → options de quantification.
  - gifski : `quality` → score gifski (1-100).
- `maxFileSize` : si dépassé en mode qualité, afficher une suggestion (baisser `colorCount` ou `quality`). Pas de réencodage automatique récursif (YAGNI).

## Progress & async

- **gifenc** : encodage synchrone → yield entre frames (`await Promise.resolve()` ou découpage) pour émettre une progression 0→1 sans geler l'UI. Worker en option si lag perçu.
- **gifski-wasm** : progression émise par frame ajoutée + étape finale de finalisation.
- **Annulation** : conserver le pattern Promise actuel (rejet sur abort).

## Tests

- **Unit** :
  - le registry retourne le bon encodeur selon `settings.encoder` ;
  - chaque `encode()` produit un `Blob` `image/gif` valide (magic bytes `GIF89a`) avec N frames ;
  - `GifMetadata` (`frameCount`, `totalDuration`, `width`, `height`, `size`) correct.
- **Régression** : les 26 tests existants restent verts ; adapter ceux qui mockaient gif.js.
- **Manuel** : comparer le poids fichier Fast vs Quality vs ancien gif.js sur un cas 10 frames @600px, et valider le rendu visuel.

## Hors périmètre (YAGNI)

- Réencodage automatique pour respecter `maxFileSize`.
- FFmpeg.wasm / 3e encodeur.
- Mode legacy gif.js.
- Export APNG / WebP animé (backlog séparé).

## Critères de succès

- gif.js totalement retiré du bundle.
- Mode Quality produit un GIF visuellement ≥ gif.js pour un poids ≤ (idéalement nettement inférieur) sur le cas de référence.
- Mode Fast encode plus vite que gif.js.
- Build de production propre, tests verts.
