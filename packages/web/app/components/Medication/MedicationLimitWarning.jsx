import { CircleAlert } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

import { DRUG_LIMIT_BREACHES } from '@tamanu/constants';
import { getDoseLimitBreach, getDrugUnitLabel } from '@tamanu/shared/utils/medication';
import { TranslatedText, useTranslation } from '@tamanu/ui-components';

import { Colors } from '../../constants';
import { lowercaseFirstLetter } from '../../utils/medications';

const Warning = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-block-start: 2px;
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.darkText};
  text-align: start;
`;

const WarningIcon = styled(CircleAlert)`
  flex-shrink: 0;
`;

/**
 * spec: DQLIM#the-inline-warning
 * Names the limit a value crossed, in the drug's unit, e.g. "Above expected max of 2 tablets".
 * `breach` comes from getLimitBreach and its wrappers; renders nothing when it is null.
 */
export const MedicationLimitWarning = ({ breach, unit, ...props }) => {
  const { getEnumTranslation } = useTranslation();
  if (!breach) return null;

  // Lowercase each ordinary word ("Blister Packs" -> "blister packs"); "mL" and "IU" keep theirs.
  const unitLabel = unit
    ? getDrugUnitLabel(unit, breach.limit, getEnumTranslation)
        .split(' ')
        .map(lowercaseFirstLetter)
        .join(' ')
    : '';
  const replacements = { limit: breach.limit, unit: unitLabel };

  return (
    <Warning role="status" data-testid="medication-limit-warning" {...props}>
      <WarningIcon size={14} color={Colors.orange} aria-hidden />
      {breach.type === DRUG_LIMIT_BREACHES.ABOVE_MAX ? (
        <TranslatedText
          stringId="medication.limitWarning.aboveMax"
          fallback="Above expected max of :limit :unit"
          replacements={replacements}
        />
      ) : (
        <TranslatedText
          stringId="medication.limitWarning.belowMin"
          fallback="Below expected min of :limit :unit"
          replacements={replacements}
        />
      )}
    </Warning>
  );
};

/**
 * For an input's helper text slot, which takes space whenever it is given anything: the warning
 * when there is a limit to warn about, otherwise nothing.
 */
export const renderLimitWarning = (breach, unit) =>
  breach ? <MedicationLimitWarning breach={breach} unit={unit} /> : undefined;

/**
 * A prescription's dose amount against the drug's dose limits, in its dosing unit. A variable
 * dose has no amount, so it is never out of range.
 */
export const DoseLimitWarning = ({
  doseAmount,
  isVariableDose = false,
  referenceDrug,
  dosingUnit,
  ...props
}) => (
  <MedicationLimitWarning
    breach={isVariableDose ? null : getDoseLimitBreach(doseAmount, referenceDrug)}
    unit={dosingUnit}
    {...props}
  />
);
