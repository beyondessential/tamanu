import React from 'react';
import styled from 'styled-components';

import { TranslatedText, useAuth } from '@tamanu/ui-components';
import DoseSummary from './DoseSummary';
import RemoveAdditionalDoseButton from './RemoveAdditionalDoseButton';

const Root = styled.div`
  border-block-start: 1px solid ${p => p.theme.palette.divider};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
`;

export const DoseHeading = styled.h3`
  color: ${p => p.theme.palette.text.secondary};
  font-size: 16px;
  font-weight: 500;
  margin-block: 14px;
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
    <Root {...props}>
      <Header>
        <DoseHeading>
          <TranslatedText
            stringId="medication.mar.dose"
            fallback="Dose&nbsp;:index"
            replacements={{ index }}
          />
          {dose.isRemoved && <RemovedLabel />}
        </DoseHeading>
        {dose.doseIndex !== 0 && !dose.isRemoved && canEditMar && (
          <RemoveAdditionalDoseButton onClick={onRemove} style={{ marginInlineStart: 'auto' }} />
        )}
      </Header>
      {!dose.isRemoved && (
        <DoseSummary dose={dose} medication={medication}>
          {children}
        </DoseSummary>
      )}
    </Root>
  );
}
