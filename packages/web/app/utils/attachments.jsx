import React from 'react';

import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';

// For a caller that can only signal by throwing, such as a `saveFile` data callback.
export class AttachmentUnavailableError extends Error {
  constructor(message) {
    super('Attachment content is unavailable');
    this.userMessage = message;
  }
}

// spec: ATCH, AV
// A 202 carrying no data is a file that exists but isn't being served.
export const getAttachmentUnavailableMessage = ({ data, availability }) => {
  // Absence, not falsiness: zero-byte content comes back as an empty string.
  if (data != null) return null;

  if (availability === BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED) {
    return (
      <TranslatedText
        stringId="attachment.unavailable.withheld"
        fallback="This file has been withheld as unsafe by a virus scan and cannot be viewed. Contact your system administrator."
      />
    );
  }

  return (
    <TranslatedText
      stringId="attachment.unavailable.pending"
      fallback="This file is not available yet. Please try again shortly."
    />
  );
};
