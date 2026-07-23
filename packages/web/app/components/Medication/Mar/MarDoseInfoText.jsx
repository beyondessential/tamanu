import React from 'react';

import { DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import { TranslatedEnum, TranslatedText } from '@tamanu/ui-components';

/**
 * @param {Pick<
 *   import('@tamanu/database').Prescription,
 *   'doseAmount' | 'dosingUnit' | 'isVariableDose'
 * >} props
 */
export default function MarDoseInfoText({ doseAmount, dosingUnit, isVariableDose }) {
  if (isVariableDose) {
    return <TranslatedText stringId="medication.mar.status.doseDue" fallback="Dose due" />;
  }
  if (dosingUnit) {
    return (
      <>
        {doseAmount}
        <br />
        <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />
      </>
    );
  }
  return null;
}
