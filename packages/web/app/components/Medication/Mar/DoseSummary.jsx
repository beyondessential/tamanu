import React from 'react';
import { TimeDisplay, TranslatedText, useTranslation } from '@tamanu/ui-components';
import { getMarDoseDisplay } from '@tamanu/shared/utils/medication';
import styled from 'styled-components';

import KeyValueDisplay from './KeyValueDisplay';

const Card = styled.div`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  column-rule: 1px solid ${p => p.theme.palette.divider};
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding-block: 16px;
  position: relative;
`;

const Column = styled.div`
  padding-inline: 20px;
`;

export default function DoseSummary({ children, dose, medication, ...props }) {
  const { getEnumTranslation } = useTranslation();
  return (
    <Card {...props}>
      <Column>
        <KeyValueDisplay
          label={<TranslatedText stringId="medication.mar.doseGiven" fallback="Dose given" />}
          value={getMarDoseDisplay(
            { doseAmount: dose.doseAmount, dosingUnit: medication.dosingUnit },
            getEnumTranslation,
          )}
        />
        <KeyValueDisplay
          label={<TranslatedText stringId="medication.mar.givenBy" fallback="Given by" />}
          value={dose.givenByUser.displayName}
        />
      </Column>
      <Column>
        <KeyValueDisplay
          label={<TranslatedText stringId="medication.mar.timeGiven" fallback="Time given" />}
          value={<TimeDisplay date={dose.givenTime} noTooltip />}
        />
        <KeyValueDisplay
          label={<TranslatedText stringId="medication.mar.recordedBy" fallback="Recorded by" />}
          value={dose.recordedByUser.displayName}
        />
      </Column>
      {children}
    </Card>
  );
}
