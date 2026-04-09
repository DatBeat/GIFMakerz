import type { Template } from '../types';

function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], name, { type: 'image/png' }));
    }, 'image/png');
  });
}

function createTextFrame(
  text: string,
  width: number,
  height: number,
  bgColor: string,
  textColor: string,
  fontSize: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  return canvas;
}

export const templates: Template[] = [
  {
    id: 'countdown',
    name: 'Compte à rebours',
    description: '5, 4, 3, 2, 1, GO !',
    category: 'countdown',
    previewEmoji: '⏱️',
    generate: async (width, height) => {
      const items = ['5', '4', '3', '2', '1', 'GO !'];
      const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ef4444'];
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const canvas = createTextFrame(items[i], width, height, colors[i], '#ffffff', Math.round(height * 0.4));
        files.push(await canvasToFile(canvas, `countdown-${i + 1}.png`));
      }
      return files;
    },
  },
  {
    id: 'beforeafter',
    name: 'Avant / Après',
    description: 'Deux frames avec labels',
    category: 'beforeafter',
    previewEmoji: '🔄',
    generate: async (width, height) => {
      const canvas1 = createTextFrame('AVANT', width, height, '#f97316', '#ffffff', Math.round(height * 0.3));
      const canvas2 = createTextFrame('APRÈS', width, height, '#22c55e', '#ffffff', Math.round(height * 0.3));
      return [
        await canvasToFile(canvas1, 'before.png'),
        await canvasToFile(canvas2, 'after.png'),
      ];
    },
  },
  {
    id: 'flashsale',
    name: 'Flash Sale',
    description: 'Animation promo urgente',
    category: 'sale',
    previewEmoji: '🔥',
    generate: async (width, height) => {
      const items = [
        { text: '-50%', bg: '#ef4444' },
        { text: 'OFFRE FLASH', bg: '#f97316' },
        { text: 'DERNIÈRE\nCHANCE', bg: '#dc2626' },
        { text: 'ACHETEZ\nMAINTENANT', bg: '#16a34a' },
      ];
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const canvas = createTextFrame(items[i].text.split('\n')[0], width, height, items[i].bg, '#ffffff', Math.round(height * 0.25));
        // Handle multiline
        if (items[i].text.includes('\n')) {
          const ctx = canvas.getContext('2d')!;
          const lines = items[i].text.split('\n');
          ctx.fillStyle = items[i].bg;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(height * 0.2)}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const lineHeight = height * 0.25;
          const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2;
          lines.forEach((line, j) => {
            ctx.fillText(line, width / 2, startY + j * lineHeight);
          });
        }
        files.push(await canvasToFile(canvas, `sale-${i + 1}.png`));
      }
      return files;
    },
  },
  {
    id: 'carousel',
    name: 'Carrousel Produit',
    description: 'Emplacements produit numérotés',
    category: 'carousel',
    previewEmoji: '🛒',
    generate: async (width, height) => {
      const colors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899'];
      const files: File[] = [];
      for (let i = 0; i < 4; i++) {
        const canvas = createTextFrame(`Produit ${i + 1}`, width, height, colors[i], '#ffffff', Math.round(height * 0.2));
        files.push(await canvasToFile(canvas, `product-${i + 1}.png`));
      }
      return files;
    },
  },
];
