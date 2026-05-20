import { describe, expect, it } from 'vitest';
import { supportsImportFile, validateDocumentTitle } from '../lib/validation';

describe('document validation', () => {
  it('requires a title', () => {
    expect(validateDocumentTitle('')).toBe('Document title is required.');
  });

  it('allows valid txt imports', () => {
    expect(supportsImportFile({ name: 'brief.txt', type: 'text/plain' })).toBe(true);
  });
});
