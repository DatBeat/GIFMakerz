import { describe, it, expect, vi } from 'vitest';

// Neutralize the WASM module so importing the registry never loads gifski wasm.
vi.mock('gifski-wasm', () => ({ default: vi.fn() }));

import { encoders } from '../index';

describe('encoder registry', () => {
  it('maps fast -> fastEncoder', () => {
    expect(encoders.fast.id).toBe('fast');
  });

  it('maps quality -> qualityEncoder', () => {
    expect(encoders.quality.id).toBe('quality');
  });
});
