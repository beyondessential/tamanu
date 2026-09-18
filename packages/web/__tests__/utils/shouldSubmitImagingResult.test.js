import { describe, expect, it } from 'vitest';

import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';

import { shouldSubmitImagingResult } from '../../app/utils/shouldSubmitImagingResult';

const { COMPLETED, IN_PROGRESS, PENDING } = IMAGING_REQUEST_STATUS_TYPES;
const completedAt = '2026-07-12 09:00:00';

const request = (status, results = []) => ({ status, results });

describe('shouldSubmitImagingResult', () => {
  it('records the completion time when the request is being completed', () => {
    const values = { status: COMPLETED, newResult: { completedAt } };
    expect(shouldSubmitImagingResult(values, request(PENDING))).toBe(true);
    expect(shouldSubmitImagingResult(values, request(IN_PROGRESS))).toBe(true);
  });

  it('does not record a result when the request is not being completed', () => {
    const values = { status: IN_PROGRESS, newResult: { completedAt } };
    expect(shouldSubmitImagingResult(values, request(PENDING))).toBe(false);
  });

  it('records an entered result whatever the request status', () => {
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt, completedById: 'user-123' } },
        request(COMPLETED, [{ id: 'result-1' }]),
      ),
    ).toBe(true);
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt, description: 'Fracture visible' } },
        request(COMPLETED, [{ id: 'result-1' }]),
      ),
    ).toBe(true);
  });

  it('does not append a blank result when re-saving a completed request', () => {
    const values = { status: COMPLETED, newResult: { completedAt } };
    expect(shouldSubmitImagingResult(values, request(COMPLETED))).toBe(false);
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt, completedById: '', description: '' } },
        request(COMPLETED),
      ),
    ).toBe(false);
    expect(shouldSubmitImagingResult({ status: COMPLETED }, request(COMPLETED))).toBe(false);
  });

  it('does not append a blank result when a request with a result is completed again', () => {
    expect(
      shouldSubmitImagingResult(
        { status: COMPLETED, newResult: { completedAt } },
        request(IN_PROGRESS, [{ id: 'result-1' }]),
      ),
    ).toBe(false);
  });
});
