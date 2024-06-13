import React from 'react';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { CAMBODIA_CUSTOM_FIELDS } from './fields';

export const labels = {
  [CAMBODIA_CUSTOM_FIELDS.NATIONAL_ID]: (
    <TranslatedText stringId="cambodiaPatientDetails.nationalId" fallback="National ID" />
  ),
  [CAMBODIA_CUSTOM_FIELDS.ID_POOR_CARD_NUMBER]: (
    <TranslatedText
      stringId="cambodiaPatientDetails.idPoorCardNumber.label"
      fallback="ID Poor Card Number"
    />
  ),
  [CAMBODIA_CUSTOM_FIELDS.PMRS_NUMBER]: (
    <TranslatedText stringId="cambodiaPatientDetails.pmrsNumber.label" fallback="PMRS Number" />
  ),
};
