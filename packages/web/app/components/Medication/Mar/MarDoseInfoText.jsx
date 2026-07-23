import React from 'react';
import styled from 'styled-components';

import { DRUG_UNIT_SHORT_LABELS } from '@tamanu/constants';
import { TranslatedEnum, TranslatedText } from '@tamanu/ui-components';

const Root = styled.div`
  display: grid;
  place-items: center;
  text-align: center;
  text-wrap: balance;
`;

/**
 * @param {React.ComponentPropsWithRef<typeof Root> &
 *   Pick<
 *     import('@tamanu/database').Prescription,
 *     'doseAmount' | 'dosingUnit' | 'isVariableDose'
 *   >
 * } props
 */
export default function MarDoseInfoText({ doseAmount, dosingUnit, isVariableDose, ...props }) {
  const body = isVariableDose ? (
    <TranslatedText stringId="medication.mar.status.doseDue" fallback="Dose due" />
  ) : dosingUnit ? (
    <>
      {doseAmount}
      <br />
      <TranslatedEnum enumValues={DRUG_UNIT_SHORT_LABELS} value={dosingUnit} />
    </>
  ) : null;

  return <Root {...props}>{body}</Root>;
}
