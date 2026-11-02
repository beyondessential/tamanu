import { describe, it, expect } from 'vitest';

import {
  getLabResultGroupKey,
  shouldShowLabResultGroupHeader,
  withLabRequestPrintoutDetails,
} from '../../app/utils/lab';

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

describe('withLabRequestPrintoutDetails', () => {
  const labRequests = [{ id: 'request-1' }, { id: 'request-2' }];

  it('attaches each request its own tests and publisher', () => {
    const result = withLabRequestPrintoutDetails(labRequests, {
      testsResponses: [{ data: [{ id: 'test-1' }] }, { data: [{ id: 'test-2' }] }],
      publishedLogs: [
        { updatedBy: { displayName: 'Dr One' } },
        { updatedBy: { displayName: 'Dr Two' } },
      ],
    });

    expect(result).toEqual([
      { id: 'request-1', tests: [{ id: 'test-1' }], publishedBy: { displayName: 'Dr One' } },
      { id: 'request-2', tests: [{ id: 'test-2' }], publishedBy: { displayName: 'Dr Two' } },
    ]);
  });

  it('keeps every request in order while its details are still loading', () => {
    const result = withLabRequestPrintoutDetails(labRequests, {
      testsResponses: [null, { data: [{ id: 'test-2' }] }],
      publishedLogs: [null, null],
    });

    expect(result.map(({ id }) => id)).toEqual(['request-1', 'request-2']);
    expect(result[0]).toEqual({ id: 'request-1', tests: undefined, publishedBy: undefined });
    expect(result[1].tests).toEqual([{ id: 'test-2' }]);
  });

  it('leaves the publisher unset for a request that was never published', () => {
    const [result] = withLabRequestPrintoutDetails([{ id: 'request-1' }], {
      testsResponses: [{ data: [] }],
      publishedLogs: [null],
    });

    expect(result.publishedBy).toBeUndefined();
  });
});
