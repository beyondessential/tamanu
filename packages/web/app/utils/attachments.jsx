import React from 'react';

import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';

// spec: ATCH, AV
// The attachment routes answer 202 with an availability state in place of the
// bytes, so a response carrying no data is a file that exists and is not being
// served. Pending takes one message whichever way it is pending; infected takes
// its own, so a reader is told the content is not coming rather than left
// waiting on it.
export const getAttachmentUnavailableMessage = ({ data, availability }) => {
  if (data) return null;

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
