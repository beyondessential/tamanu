import { CircleAlert } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

import { DRUG_LIMIT_BREACHES } from '@tamanu/constants';
import { getDrugUnitLabel } from '@tamanu/shared/utils/medication';
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

  /*
   * Table cells balance their lines (see the theme), which would split a warning below a quantity
   * input into two short lines using half the input's width. Below an input, fill the width the
   * way text does outside tables.
   */
  .MuiFormHelperText-root & {
    text-wrap-style: pretty;
  }
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
    <Warning data-testid="medication-limit-warning" {...props}>
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
 * The warning when there is a limit to warn about, otherwise nothing. Used for an input's helper
 * text slot, which takes space whenever it is given anything, and below a dose shown as text.
 */
export const renderLimitWarning = (breach, unit) =>
  breach ? <MedicationLimitWarning breach={breach} unit={unit} /> : undefined;
