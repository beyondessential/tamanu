import React from 'react';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TranslatedText } from './TranslatedText';

export const VISIBILITY_STATUS_TRANSLATIONS = /** @type {const} */ ({
  [VISIBILITY_STATUSES.CURRENT]: (
    <TranslatedText stringId="visibilityStatus.current" fallback="Current" />
  ),
  [VISIBILITY_STATUSES.HISTORICAL]: (
    <TranslatedText stringId="visibilityStatus.historical" fallback="Historical" />
  ),
  [VISIBILITY_STATUSES.MERGED]: (
    <TranslatedText stringId="visibilityStatus.merged" fallback="Merged" />
  ),
});

export function TranslatedVisibilityStatus({ visibilityStatus }) {
  if (!visibilityStatus) {
    return <TranslatedText stringId="visibilityStatus.unknown" fallback="Unknown" />;
  }

  return VISIBILITY_STATUS_TRANSLATIONS[visibilityStatus] ?? visibilityStatus;
}
