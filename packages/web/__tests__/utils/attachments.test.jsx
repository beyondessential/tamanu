import { describe, expect, it } from 'vitest';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { getAttachmentUnavailableMessage } from '../../app/utils/attachments';

// 202 is ok, so a caller reading `data` alone gets undefined; every data-less state must resolve to
// a message.
const stringIdFor = availability =>
  getAttachmentUnavailableMessage({ availability })?.props?.stringId;

describe('getAttachmentUnavailableMessage', () => {
  it('has no message for a response carrying content', () => {
    expect(getAttachmentUnavailableMessage({ data: 'aGVsbG8=' })).toBeNull();
  });

  // spec: CAS
  it('treats zero-byte content as served', () => {
    expect(getAttachmentUnavailableMessage({ data: '' })).toBeNull();
  });

  // spec: ATCH
  it('gives the same pending message for every awaiting state', () => {
    const pending = [
      BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
      BLOB_AVAILABILITY_STATES.AWAITING_SCAN,
    ].map(stringIdFor);

    expect(new Set(pending)).toEqual(new Set(['attachment.unavailable.pending']));
  });

  // spec: AV
  it('distinguishes content withheld as infected', () => {
    expect(stringIdFor(BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED)).toBe(
      'attachment.unavailable.withheld',
    );
  });

  it('falls back to the pending message for an unrecognised state', () => {
    expect(stringIdFor(undefined)).toBe('attachment.unavailable.pending');
  });

  it('covers every availability state that is not available', () => {
    const withheld = Object.values(BLOB_AVAILABILITY_STATES).filter(
      state => state !== BLOB_AVAILABILITY_STATES.AVAILABLE,
    );

    for (const state of withheld) {
      expect(stringIdFor(state)).toBeTruthy();
    }
  });
});
