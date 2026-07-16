import { describe, expect, it } from 'vitest';

// Focused regression test for the result-submit guard in
// packages/web/app/views/patients/imagingRequest/ImagingRequestView.jsx.
//
// The guard is inline (non-exported), so this test mirrors the EXACT predicate
// from the fixed source. `newResult.completedAt` is pre-seeded with the current
// time, so it cannot indicate whether the user actually entered a result; the
// server creates an ImagingResult whenever completedAt is truthy. The fix only
// attaches newResult when a clinician (completedById) or a description was
// entered, so re-saving a completed request no longer appends a blank result.
const hasEnteredResult = newResult => Boolean(newResult?.completedById || newResult?.description);

describe('imaging request newResult submit guard', () => {
  it('attaches the result when a completed-by clinician is set', () => {
    expect(hasEnteredResult({ completedById: 'user-123', completedAt: '2026-07-12 09:00:00' })).toBe(
      true,
    );
  });

  it('attaches the result when a description is set', () => {
    expect(
      hasEnteredResult({ description: 'Fracture visible', completedAt: '2026-07-12 09:00:00' }),
    ).toBe(true);
  });

  it('does NOT attach the result when only completedAt is present', () => {
    // This is the bug: completedAt is always pre-filled, so a bare save would
    // otherwise append an empty result row.
    expect(hasEnteredResult({ completedAt: '2026-07-12 09:00:00' })).toBe(false);
  });

  it('does NOT attach the result for an empty or missing newResult', () => {
    expect(hasEnteredResult({})).toBe(false);
    expect(hasEnteredResult(undefined)).toBe(false);
    expect(hasEnteredResult({ completedById: '', description: '' })).toBe(false);
  });
});
