import { describe, it, expect } from 'vitest';

import { getLabResultGroupKey, shouldShowLabResultGroupHeader } from '../../app/utils/lab';

describe('lab result grouping helpers', () => {
  const panelA1 = { labTestPanel: { id: 'panel-a', name: 'A' } };
  const panelA2 = { labTestPanel: { id: 'panel-a', name: 'A' } };
  const panelB = { labTestPanel: { id: 'panel-b', name: 'B' } };
  const individual = { labTestPanel: null };
  const reflex = {}; // reflex tests come back with no panel at all

  it('keys a row by its panel id, or the individual sentinel when it has no panel', () => {
    expect(getLabResultGroupKey(panelA1)).toBe('panel-a');
    expect(getLabResultGroupKey(individual)).toBe('individual');
    expect(getLabResultGroupKey(reflex)).toBe('individual');
  });

  it('shows a header for the first row of a page (no previous row)', () => {
    expect(shouldShowLabResultGroupHeader(panelA1, undefined)).toBe(true);
  });

  it('hides the header within the same panel group', () => {
    expect(shouldShowLabResultGroupHeader(panelA2, panelA1)).toBe(false);
  });

  it('shows the header when the group changes', () => {
    expect(shouldShowLabResultGroupHeader(panelB, panelA1)).toBe(true); // panel → panel
    expect(shouldShowLabResultGroupHeader(individual, panelB)).toBe(true); // panel → individual
  });

  it('treats individual and reflex tests as one group', () => {
    expect(shouldShowLabResultGroupHeader(reflex, individual)).toBe(false);
  });
});
