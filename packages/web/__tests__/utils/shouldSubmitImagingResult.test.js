import { describe, expect, it } from 'vitest';

import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';

import { shouldSubmitImagingResult } from '../../app/utils/shouldSubmitImagingResult';

const { COMPLETED, IN_PROGRESS, PENDING } = IMAGING_REQUEST_STATUS_TYPES;
const completedAt = '2026-07-12 09:00:00';

describe('shouldSubmitImagingResult', () => {
  it('records a result when the request is being completed', () => {
    expect(
      shouldSubmitImagingResult({ status: COMPLETED, newResult: { completedAt } }, PENDING),
    ).toBe(true);
    expect(
      shouldSubmitImagingResult({ status: COMPLETED, newResult: { completedAt } }, IN_PROGRESS),
    ).toBe(true);
  });

  it('does not record a result when the request is not being completed', () => {
    expect(
      shouldSubmitImagingResult({ status: IN_PROGRESS, newResult: { completedAt } }, PENDING),
    ).toBe(false);
  });

  it('records an additional result on a completed request when one was entered', () => {
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt, completedById: 'user-123' } },
        COMPLETED,
      ),
    ).toBe(true);
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt, description: 'Fracture visible' } },
        COMPLETED,
      ),
    ).toBe(true);
  });

  it('does not append a blank result when re-saving a completed request', () => {
    expect(
      shouldSubmitImagingResult({ status: COMPLETED, newResult: { completedAt } }, COMPLETED),
    ).toBe(false);
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt, completedById: '', description: '' } },
        COMPLETED,
      ),
    ).toBe(false);
    expect(shouldSubmitImagingResult({ status: COMPLETED }, COMPLETED)).toBe(false);
  });
});
