import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../app/utils/escapeHtml';

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;',
    );
  });

  it('leaves plain names untouched', () => {
    expect(escapeHtml('Aroha Te Rangi')).toBe('Aroha Te Rangi');
  });

  it('returns an empty string for missing values', () => {
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});
