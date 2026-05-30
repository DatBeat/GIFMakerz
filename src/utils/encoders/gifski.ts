import type { Encoder } from './index';

export const qualityEncoder: Encoder = {
  id: 'quality',
  async encode() {
    throw new Error('not implemented');
  },
};
