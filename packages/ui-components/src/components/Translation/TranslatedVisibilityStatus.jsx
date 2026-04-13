import React from 'react';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { TranslatedText } from './TranslatedText';

const translations = /** @type {const} */ ({
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
    return (
      <TranslatedText
        stringId="admin.programRegistries.visibilityStatus.unknown"
        fallback="Unknown"
      />
    );
  }

  return translations[visibilityStatus] ?? visibilityStatus;
}
