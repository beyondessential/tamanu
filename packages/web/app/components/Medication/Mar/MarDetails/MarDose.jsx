import React from 'react';
import styled from 'styled-components';

import { TranslatedText, useAuth } from '@tamanu/ui-components';
import DoseSummary from './DoseSummary';
import RemoveAdditionalDoseButton from './RemoveAdditionalDoseButton';

export const DoseHeader = styled.header`
  border-block-start: 1px solid ${p => p.theme.palette.divider};
  display: grid;
  grid-template-columns: 1fr auto;
  padding-block: 14px;
`;

export const DoseHeading = styled.h3`
  color: ${p => p.theme.palette.text.secondary};
  font-size: 16px;
  font-weight: 500;
  margin-block: 0;
`;

const RemovedLabel = styled.span.attrs({
  children: (
    <>
      {' '}
      <TranslatedText stringId="medication.mar.removed" fallback="(removed)" />
    </>
  ),
})`
  color: ${p => p.theme.palette.text.tertiary};
`;

export default function DoseEntry({ children, dose, index, medication, onRemove, ...props }) {
  const { ability } = useAuth();
  const canEditMar = ability.can('write', 'MedicationAdministration');

  return (
    <li {...props}>
      <DoseHeader>
        <DoseHeading>
          <TranslatedText
            stringId="medication.mar.dose"
            fallback="Dose&nbsp;:index"
            replacements={{ index }}
          />
          {dose.isRemoved && <RemovedLabel />}
        </DoseHeading>
        {dose.doseIndex !== 0 && !dose.isRemoved && canEditMar && (
          <RemoveAdditionalDoseButton onClick={onRemove} />
        )}
      </DoseHeader>
      {!dose.isRemoved && (
        <DoseSummary dose={dose} medication={medication}>
          {children}
        </DoseSummary>
      )}
    </li>
  );
}
