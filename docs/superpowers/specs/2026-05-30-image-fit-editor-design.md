# Gestion avancée du cadrage d'image (per-frame fit editor) — Design

**Date :** 2026-05-30
**Statut :** Validé (en attente de revue spec)
**Objectif :** Permettre, par image, de choisir comment elle se place dans le gabarit de sortie du GIF quand son ratio diffère — au lieu de l'étirement (déformation) actuel. Modes : remplir, contenir, couvrir, mosaïque, et recadrage manuel (zoom + déplacement).

## Contexte

Aujourd'hui tout le rendu passe par `drawImageToCanvas(img, width, height)` (`src/utils/imageUtils.ts`) qui fait un `ctx.drawImage(img, 0, 0, width, height)` — un **étirement** qui déforme dès que le ratio source ≠ ratio de sortie. Trois sites de rendu l'utilisent : `gifEncoder.ts` (build des frames sans transition), `transitions.ts` (canvases source des transitions), `Preview.tsx` (build de la séquence animée). `videoExtractor.ts` utilise `drawImage` pour **capturer** des frames vidéo (création de la source, pas de cadrage de sortie) → hors périmètre.

## Décision

Un **éditeur de cadrage par frame**, modal, basé sur un **modèle de transformation unique** :
- **Presets** (remplir / contenir / couvrir / mosaïque) = boutons qui posent un `fit` + une transfo de départ.
- **Manuel** = glisser (pan) + molette (zoom) → mode `custom` avec transfo explicite. Subsume le « crop libre » et le « focal point » et le « zoom » en une seule interaction.

Le défaut à l'upload passe de l'étirement à **`cover`** (couvrir) : aucune déformation, rendu propre sans bande.

## Modèle de données

`src/types.ts` :

```ts
export type FitMode = 'fill' | 'contain' | 'cover' | 'tile' | 'custom';

export interface FrameTransform {
  scale: number;    // multiplicateur sur l'échelle de base "cover" (>= 1 = zoom avant), défaut 1
  offsetX: number;  // pan horizontal normalisé [-1..1], 0 = centré
  offsetY: number;  // pan vertical normalisé [-1..1], 0 = centré
}

export type FrameBackground =
  | { type: 'color'; color: string }  // ex. '#ffffff'
  | { type: 'blur' };                 // copie floutée de l'image en backdrop

// FrameImage gagne :
//   fit: FitMode;                  // défaut 'cover'
//   transform?: FrameTransform;    // utilisé en mode 'cover' et 'custom'
//   background?: FrameBackground;  // utilisé en mode 'contain' (défaut color blanc)
```

`offsetX/offsetY` sont normalisés par rapport au **dépassement disponible** (overflow) à l'échelle courante : 0 = centré, ±1 = bord atteint. Indépendant des dimensions exactes → stable quand la largeur de sortie change.

## Géométrie de rendu — fonction pure testable

`src/utils/fit.ts` (nouveau) :

```ts
export interface FitRect { dx: number; dy: number; dWidth: number; dHeight: number }

// Calcule le rectangle de destination pour dessiner la source dans le gabarit.
// Couvre fill | contain | cover | custom. (tile est géré séparément par le renderer.)
export function computeFitRect(
  srcW: number, srcH: number,
  outW: number, outH: number,
  fit: FitMode,
  transform?: FrameTransform
): FitRect;
```

- **fill** : `{dx:0, dy:0, dWidth:outW, dHeight:outH}` (étirement, rétrocompat).
- **contain** : ratio préservé, image entière, centrée → bandes autour (remplies par le renderer).
- **cover / custom** : ratio préservé, remplit le gabarit (base cover), puis applique `transform.scale` (défaut 1) et `offsetX/offsetY`. Le dépassement est rogné par le clip du canvas.
- **tile** : non géré par `computeFitRect` (le renderer répète la source).

Cette fonction est **pure et testable sans canvas** (jsdom-safe).

## Renderer partagé

`src/utils/imageUtils.ts` — nouvelle fonction :

```ts
export function drawImageWithFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  opts: { fit: FitMode; transform?: FrameTransform; background?: FrameBackground; width: number; height: number }
): void;
```

Logique :
1. **Fond** :
   - `contain` + `background.type==='color'` → `fillRect` couleur.
   - `contain` + `background.type==='blur'` → dessiner l'image agrandie en mode cover avec `ctx.filter = 'blur(20px)'` (backdrop), puis `ctx.filter = 'none'`.
   - autres modes → pas de fond (l'image couvre tout).
2. **Image** :
   - `fill` / `contain` / `cover` / `custom` → `computeFitRect(...)` puis `ctx.drawImage(img, dx, dy, dWidth, dHeight)`.
   - `tile` → calculer une taille de tuile = source mise à l'échelle de la hauteur du gabarit, puis boucler `drawImage` pour remplir largeur×hauteur.
3. Le clip du canvas (taille = gabarit) rogne naturellement le dépassement.

Un helper `drawImageToFitCanvas(img, opts)` crée un canvas dimensionné au gabarit et appelle `drawImageWithFit`, en remplacement des appels `drawImageToCanvas` aux 3 sites de rendu. `drawImageToCanvas` (étirement) reste pour usage interne éventuel mais n'est plus le chemin par défaut.

## Câblage des sites de rendu

Les fits par frame doivent atteindre les renderers. On propage un tableau parallèle `frameFits` (un `{fit, transform, background}` par frame), comme les `frameDurations`/`frameTextOverlays` existants :

- `GenerateButton` construit `frameFits` depuis `frames` et le passe à `encodeGif`.
- `encodeGif` (`gifEncoder.ts`) le passe à `buildFrames` / `buildFramesWithTransitions`.
- `transitions.ts` : `TransitionConfig` gagne `frameFits?`; les canvases source sont construits via `drawImageWithFit`.
- `Preview.tsx` : le build de séquence (chemin sans transition + chemin transitions) utilise les fits par frame.

## Éditeur modal

`src/components/FrameFitEditor.tsx` (nouveau) :
- Ouvert au clic sur un **bouton « ✎ cadrer »** ajouté en overlay sur `FrameItem` (bouton dédié pour ne pas entrer en conflit avec les listeners de drag dnd-kit).
- Canvas d'aperçu au **ratio de sortie** (largeur/hauteur courantes), rendu live via `drawImageWithFit`.
- Boutons de mode : Remplir / Contenir / Couvrir / Mosaïque. Choisir un preset réinitialise la transfo associée.
- **Glisser** sur le canvas = pan ; **molette** = zoom (clamp `scale ∈ [1, 5]`). Les deux passent le mode en `custom`.
- En mode `contain` : contrôle de fond visible — bascule **Couleur** (avec `<input type="color">`) / **Flou**.
- Bouton **« Appliquer à toutes les frames »** : copie le `{fit, transform, background}` courant sur toutes les frames.
- **Valider** (persiste) / **Annuler** (jette les changements). Fermeture par overlay/Escape = Annuler.
- Pas de dialog JS natif (overlay React).

## Store (zustand) — `gifStore.ts`

- `addFrames` : initialise `fit: 'cover'` sur chaque nouvelle frame (transform/background non définis → défauts à l'usage).
- `updateFrameFit(id: string, partial: Partial<{ fit, transform, background }>)`.
- `applyFitToAll(state: { fit: FitMode; transform?: FrameTransform; background?: FrameBackground })`.
- `GifState` étendu en conséquence. `reset` inchangé (vide les frames).

## Vignette `FrameItem`

La miniature reflète le mode via `object-fit` CSS mappé : `cover→cover`, `contain→contain`, `fill→fill`, `tile/custom→cover` (approximation visuelle). Le rendu **exact** (zoom/pan/flou) vit dans l'éditeur modal et l'aperçu principal, pas dans la vignette 80px.

## Tests

- **Unit `computeFitRect`** (pur, sans canvas) :
  - `fill` → rect plein gabarit.
  - `contain` portrait dans paysage → largeur < outW, centré, hauteur = outH (ou inverse).
  - `cover` → couvre le gabarit (dWidth ≥ outW et dHeight ≥ outH), centré à transform défaut.
  - `custom` avec `scale=2` → dimensions doublées vs cover ; `offsetX=1` → décalage au bord.
- **Store** : `addFrames` → `fit==='cover'` ; `updateFrameFit` modifie une frame ; `applyFitToAll` propage à toutes.
- **Régression** : les tests existants restent verts.
- **Manuel (navigateur)** : portrait 4:5 dans 600×400 → vérifier chaque mode + zoom/pan + fond couleur/flou + « appliquer à toutes », et que l'aperçu animé = sortie générée.

## Hors périmètre (YAGNI)

- Rotation / flip de l'image.
- Filtres (luminosité, contraste…).
- `tile` paramétrable (taille/espacement de tuile) — répétition simple seulement.
- Recadrage non-rectangulaire.
- Modification de `videoExtractor` (capture source, pas cadrage de sortie).

## Critères de succès

- Une image de ratio différent n'est plus déformée par défaut (cover).
- L'utilisateur peut, par image, choisir fill/contain/cover/tile et recadrer manuellement (zoom+pan).
- `contain` propose fond couleur ou flou par image.
- Aperçu animé = GIF généré (même renderer).
- Build prod propre, tests verts.
