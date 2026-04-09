import type { Preset } from '../types';

export const presets: Preset[] = [
  {
    name: 'hero',
    label: 'Hero Banner',
    width: 600,
    quality: 'high',
    maxFileSize: 1000,
    description: "Image principale d'un email",
  },
  {
    name: 'product',
    label: 'Produit animé',
    width: 300,
    quality: 'medium',
    maxFileSize: 500,
    description: 'Showcase produit',
  },
  {
    name: 'cta',
    label: 'CTA animé',
    width: 200,
    quality: 'medium',
    maxFileSize: 250,
    description: 'Bouton ou call-to-action',
  },
  {
    name: 'countdown',
    label: 'Compte à rebours',
    width: 400,
    quality: 'low',
    maxFileSize: 250,
    description: 'Urgence / promo limitée',
  },
  {
    name: 'carousel',
    label: 'Carrousel léger',
    width: 600,
    quality: 'low',
    maxFileSize: 500,
    description: 'Défilement de visuels',
  },
];
