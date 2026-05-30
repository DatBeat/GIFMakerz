import type { Encoder } from './index';

export const fastEncoder: Encoder = {
  id: 'fast',
  async encode() {
    throw new Error('not implemented');
  },
};
