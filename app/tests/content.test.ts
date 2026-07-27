import { describe, expect, it } from 'vitest';
import { t, isFallback } from '@/content/i18n';

describe('localization fallback', () => {
  it('returns the requested locale when present', () => {
    expect(t({ tr: 'Lale', en: 'Tulip' }, 'tr')).toBe('Lale');
  });

  it('falls back to English when Turkish is missing, as in the legacy dataset', () => {
    expect(t({ tr: null, en: 'Tulip' }, 'tr')).toBe('Tulip');
    expect(isFallback({ tr: null, en: 'Tulip' }, 'tr')).toBe(true);
  });

  it('never returns null to the UI', () => {
    expect(t({ tr: null, en: null }, 'tr')).toBe('');
    expect(t(undefined, 'en')).toBe('');
  });
});
