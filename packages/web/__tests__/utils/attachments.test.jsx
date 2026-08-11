import { describe, expect, it } from 'vitest';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { getAttachmentUnavailableMessage } from '../../app/utils/attachments';

// The attachment routes answer 202 with an availability state in place of the
// bytes, and 202 is an ok response, so a caller that reads `data` alone gets
// undefined and shows nothing. Every state that carries no data has to resolve
// to a message.
const stringIdFor = availability =>
  getAttachmentUnavailableMessage({ availability })?.props?.stringId;

describe('getAttachmentUnavailableMessage', () => {
  it('has no message for a response carrying content', () => {
    expect(getAttachmentUnavailableMessage({ data: 'aGVsbG8=' })).toBeNull();
  });

  // spec: ATCH — one awaiting-content message whichever way it is pending
  it('gives the same pending message for every awaiting state', () => {
    const pending = [
      BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD,
      BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
      BLOB_AVAILABILITY_STATES.AWAITING_SCAN,
    ].map(stringIdFor);

    expect(new Set(pending)).toEqual(new Set(['attachment.unavailable.pending']));
  });

  // spec: AV — a reader is told the content is not coming rather than left
  // waiting on it, so this cannot share the pending message
  it('distinguishes content withheld as infected', () => {
    expect(stringIdFor(BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED)).toBe(
      'attachment.unavailable.withheld',
    );
  });

  // A response shape the client does not recognise still carries no bytes, so it
  // gets the pending message rather than rendering an empty file.
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
