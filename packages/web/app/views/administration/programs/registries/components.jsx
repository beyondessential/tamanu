import React from 'react';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';

const VISIBILITY_STATUS_FALLBACKS = /** @type {const} */ ({
  [VISIBILITY_STATUSES.CURRENT]: 'Current',
  [VISIBILITY_STATUSES.HISTORICAL]: 'Historical',
  [VISIBILITY_STATUSES.MERGED]: 'Merged',
});

export const ColourCell = ({ color }) => {
  return color || <>&mdash;</>;
};

export const VisibilityCell = ({ visibilityStatus }) => (
  <TranslatedText
    stringId={`admin.programRegistries.visibilityStatus.${visibilityStatus || 'unknown'}`}
    fallback={VISIBILITY_STATUS_FALLBACKS[visibilityStatus] ?? visibilityStatus ?? '—'}
  />
);
