# PRD — GIF Maker for Email Marketing

## 1. Vision & Objectif

### Problème
Les équipes marketing ont besoin de créer des GIFs animés optimisés pour l'email marketing à partir d'images statiques. Aujourd'hui, cela nécessite des outils complexes (Photoshop, After Effects) ou des services en ligne limités qui ne tiennent pas compte des contraintes spécifiques de l'emailing (poids, dimensions, compatibilité clients mail).

### Solution
Une **web app** légère et intuitive qui permet de :
1. Uploader plusieurs images
2. Configurer les paramètres d'animation et d'optimisation
3. Générer un GIF respectant les contraintes email marketing
4. Prévisualiser le rendu et télécharger le fichier final

### Pourquoi une Web App (et pas un .exe)
| Critère | Web App | Application Windows |
|---|---|---|
| Installation | Aucune | Requise |
| Plateforme | Tous OS + Mobile | Windows uniquement |
| Mise à jour | Instantanée | Redistribution |
| Cible marketing | Habituée au navigateur | Friction à l'installation |
| Développement | Plus rapide avec Claude Code | Plus complexe (Electron/Tauri) |
| Partage | Simple URL | Envoi de fichier |

---

## 2. Utilisateur Cible

- **Persona principal** : Responsable emailing / Email marketer
- **Persona secondaire** : Growth marketer, designer junior
- **Niveau technique** : Non-technique à intermédiaire
- **Contexte d'utilisation** : Création rapide de visuels animés pour campagnes email

---

## 3. Fonctionnalités

### 3.1 — Upload d'images

- **Drag & drop** ou clic pour sélectionner les fichiers
- Formats acceptés : PNG, JPG, WEBP
- Nombre d'images : 2 à 20 frames
- Réorganisation des images par glisser-déposer (l'ordre des images = l'ordre des frames)
- Aperçu miniature de chaque image uploadée
- Possibilité de supprimer une image individuellement

### 3.2 — Paramètres de configuration

#### Paramètres essentiels (affichés par défaut)

| Paramètre | Description | Valeurs | Défaut |
|---|---|---|---|
| Durée par frame | Temps d'affichage de chaque image | 100ms — 5000ms (slider) | 500ms |
| Largeur de sortie | Largeur du GIF en pixels | 200px — 800px | 600px |
| Qualité | Compromis taille/qualité | Basse / Moyenne / Haute | Moyenne |
| Boucle | Nombre de répétitions | Infinie / 1x / 2x / 3x / Personnalisé | Infinie |

#### Paramètres avancés (panneau dépliable)

| Paramètre | Description | Valeurs | Défaut |
|---|---|---|---|
| Transition | Effet entre les frames | Aucune / Fondu (crossfade) / Slide | Aucune |
| Durée de transition | Durée de l'effet de transition | 100ms — 1000ms | 300ms |
| Hauteur de sortie | Forcer un ratio ou une hauteur | Auto (conserve ratio) / Personnalisé | Auto |
| Poids max cible | Taille fichier maximale souhaitée | 250KB / 500KB / 1MB / Illimité | 500KB |
| Dithering | Méthode de tramage | Aucun / Floyd-Steinberg / Ordered | Floyd-Steinberg |
| Nombre de couleurs | Palette couleur du GIF | 16 / 32 / 64 / 128 / 256 | 128 |
| Vitesse d'encodage | Rapidité vs qualité d'encodage | 1 (meilleure qualité) — 10 (plus rapide) | 5 |

### 3.3 — Prévisualisation en temps réel

- Player animé affichant le rendu du GIF avant génération
- Affichage du poids estimé en temps réel
- Indicateur visuel : vert (< 250KB) / orange (250KB–500KB) / rouge (> 500KB)
- Contrôles play / pause / frame par frame
- Affichage des dimensions finales

### 3.4 — Génération et export

- Bouton "Générer le GIF"
- Barre de progression pendant l'encodage
- Téléchargement direct du fichier .gif
- Affichage des métadonnées finales : poids, dimensions, nombre de frames, durée totale

### 3.5 — Presets Email Marketing

Presets prédéfinis pour les cas d'usage courants :

| Preset | Largeur | Qualité | Poids cible | Usage |
|---|---|---|---|---|
| Hero Banner | 600px | Haute | 1MB | Image principale d'un email |
| Produit animé | 300px | Moyenne | 500KB | Showcase produit |
| CTA animé | 200px | Moyenne | 250KB | Bouton ou call-to-action |
| Compte à rebours | 400px | Basse | 250KB | Urgence / promo limitée |
| Carrousel léger | 600px | Basse | 500KB | Défilement de visuels |

---

## 4. Contraintes Email Marketing

Le GIF généré doit respecter ces contraintes pour une compatibilité maximale :

- **Poids** : Idéalement < 500KB (certains clients tronquent les emails lourds)
- **Largeur** : Maximum 600px (standard emailing)
- **Format** : GIF89a (le seul format animé universellement supporté en email)
- **Première frame** : Doit être significative (Outlook n'affiche que la 1ère frame)
- **Durée** : Les GIFs courts (3-5 secondes) performent mieux

> **Avertissement UX** : Si l'utilisateur génère un GIF > 1MB, afficher un warning expliquant les risques de non-affichage dans certains clients email (Gmail coupe à ~102KB le HTML, les images restent mais le chargement ralentit).

---

## 5. Architecture Technique

### Stack recommandée

```
Frontend : React + TypeScript
Styling  : Tailwind CSS
Encodage : gif.js (côté client, Web Workers)
Preview  : Canvas API
Upload   : react-dropzone
State    : Zustand (léger) ou useState
Build    : Vite
```

### Pourquoi tout côté client ?
- **Pas de serveur** = pas de coût d'hébergement, pas de latence
- **Confidentialité** : les images ne quittent jamais le navigateur
- **Simplicité** : déployable sur Vercel, Netlify, ou GitHub Pages
- **Performance** : Web Workers pour l'encodage sans bloquer l'UI

### Schéma fonctionnel

```
[Upload Images]
      │
      ▼
[Réorganisation & Aperçu]
      │
      ▼
[Configuration Paramètres] ◄── [Presets Email]
      │
      ▼
[Prévisualisation Canvas]
      │
      ▼
[Encodage GIF via Web Worker]
      │
      ▼
[Téléchargement .gif]
```

---

## 6. Interface Utilisateur — Wireframe Textuel

```
┌──────────────────────────────────────────────────────────┐
│  🎬 GIF Maker — Email Marketing                    [?]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐     │
│  │                                                 │     │
│  │     Glissez vos images ici                      │     │
│  │     ou cliquez pour sélectionner                │     │
│  │     PNG, JPG, WEBP • 2 à 20 images             │     │
│  │                                                 │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  Frames : [img1] [img2] [img3] [img4]  ← drag to sort   │
│                                                          │
│  ── Preset rapide ──────────────────────────────────     │
│  ( Hero Banner ) ( Produit ) ( CTA ) ( Countdown )       │
│                                                          │
│  ── Paramètres ─────────────────────────────────────     │
│  Durée par frame    ████████░░░░  500ms                  │
│  Largeur            ████████████░  600px                  │
│  Qualité            ○ Basse  ● Moyenne  ○ Haute          │
│  Boucle             [Infinie ▼]                          │
│                                                          │
│  ▸ Paramètres avancés                                    │
│                                                          │
│  ── Prévisualisation ───────────────────────────────     │
│  ┌─────────────────────────┐                             │
│  │                         │  Dimensions : 600 × 400px   │
│  │      [GIF Preview]      │  Poids estimé : ~320KB  🟢  │
│  │                         │  Frames : 4                  │
│  │    ◄  ▶  ►►             │  Durée : 2.0s               │
│  └─────────────────────────┘                             │
│                                                          │
│  [ ████████████  Générer le GIF  ████████████ ]          │
│                                                          │
│  ⚠️ Astuce : Outlook n'affiche que la 1ère frame.        │
│     Assurez-vous qu'elle est significative.               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Scénarios Utilisateur

### Scénario 1 — Création rapide avec preset
1. L'utilisateur ouvre l'app
2. Il drag & drop 4 images produit
3. Il clique sur le preset "Produit animé"
4. Les paramètres se configurent automatiquement (300px, Moyenne, 500KB)
5. La prévisualisation se lance
6. Il clique "Générer le GIF"
7. Le fichier se télécharge

### Scénario 2 — Configuration personnalisée
1. L'utilisateur uploade 8 images
2. Il réorganise l'ordre des frames
3. Il règle manuellement : 800ms/frame, 600px, Haute qualité
4. Il déplie les paramètres avancés et active le fondu entre frames
5. Le poids estimé affiche 1.2MB en rouge
6. Il réduit la qualité et le nombre de couleurs jusqu'à passer sous 500KB
7. Il génère et télécharge

### Scénario 3 — CTA animé
1. L'utilisateur uploade 2 images (bouton état normal + état hover)
2. Il sélectionne le preset "CTA animé"
3. Durée par frame : 700ms
4. GIF de 45KB généré
5. Téléchargement et intégration dans l'email

---

## 8. Critères de Succès (Definition of Done)

- [ ] Upload drag & drop fonctionnel (PNG, JPG, WEBP)
- [ ] Réorganisation des frames par glisser-déposer
- [ ] Tous les paramètres essentiels fonctionnels
- [ ] Prévisualisation animée en temps réel
- [ ] Indicateur de poids avec code couleur
- [ ] Encodage GIF fonctionnel via Web Worker
- [ ] Téléchargement du fichier .gif
- [ ] Presets email marketing appliquent correctement les paramètres
- [ ] Avertissement si GIF > 1MB
- [ ] Responsive (utilisable sur tablette minimum)
- [ ] Fonctionne 100% côté client (aucune donnée envoyée à un serveur)
- [ ] Temps d'encodage < 5 secondes pour 10 frames à 600px

---

## 9. Hors Périmètre (V1)

Les fonctionnalités suivantes sont explicitement exclues de la V1 :

- Ajout de texte / overlay sur les frames
- Édition d'image (crop, filtre, luminosité)
- Import depuis URL
- Import vidéo → GIF
- Comptes utilisateur / sauvegarde de projets
- API / intégration tierce
- Mode collaboratif
- Génération côté serveur

---

## 10. Évolutions Futures (V2+)

- Ajout de texte animé sur les frames
- Import vidéo (MP4 → GIF avec sélection de segment)
- Templates email complets avec GIF intégré
- Intégration directe avec les ESP (Mailchimp, Brevo, Klaviyo)
- Mode batch (générer plusieurs GIFs d'un coup)
- Historique local (localStorage) des dernières générations
- Export APNG comme alternative au GIF

---

## 11. Instructions pour Claude Code

### Prompt de démarrage suggéré

```
Initialise un projet React + TypeScript avec Vite et Tailwind CSS.

L'application est un "GIF Maker for Email Marketing" qui fonctionne 
100% côté client (pas de backend).

Réfère-toi au PRD ci-joint pour l'ensemble des spécifications.

Commence par :
1. Setup du projet (Vite + React + TS + Tailwind)
2. Composant d'upload avec react-dropzone
3. Composant de réorganisation des frames (drag & drop)
4. Panneau de configuration des paramètres
5. Prévisualisation Canvas
6. Encodage GIF avec gif.js dans un Web Worker
7. Composant de téléchargement

Utilise Zustand pour le state management.
Assure-toi que l'UI est moderne, épurée et professionnelle.
```

### Librairies à installer

```bash
npm install react-dropzone gif.js zustand @dnd-kit/core @dnd-kit/sortable
npm install -D tailwindcss @tailwindcss/vite
```

### Points d'attention pour le développeur

1. **gif.js** nécessite des Web Workers — s'assurer que le bundler Vite est configuré correctement pour les worker files
2. **La prévisualisation** doit utiliser le Canvas API et non un vrai GIF encodé à chaque changement (trop lent)
3. **Le poids estimé** peut être calculé approximativement via : `(largeur × hauteur × nb_frames × facteur_qualité)`
4. **Les transitions (fondu)** nécessitent de générer des frames intermédiaires via Canvas avant l'encodage
5. **Première frame** : Ajouter un badge visuel "👁 Vue Outlook" pour rappeler son importance
