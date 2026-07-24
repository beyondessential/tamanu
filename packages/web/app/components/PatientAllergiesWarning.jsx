import AlertTitle, { alertTitleClasses } from '@mui/material/AlertTitle';
import React from 'react';
import styled from 'styled-components';

import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { Alert, TranslatedText } from '@tamanu/ui-components';
import { usePatientAllergiesQuery } from '../api/queries/usePatientAllergiesQuery';

const StyledAlertTitle = styled(AlertTitle).attrs({ component: 'h3' })`
  &.${alertTitleClasses.root} {
    font-size: inherit;
    margin-block-end: 0;
  }
`;

const UnorderedList = styled.ul`
  margin-block: 0;
  padding-inline-start: 1em;
`;

export default function PatientAllergiesWarning({ patientId, ...props }) {
  const { data, isLoading } = usePatientAllergiesQuery(patientId);
  const patientAllergies = data?.data;

  if (isLoading || !patientAllergies?.length) return null;

  return (
    <Alert color="error" severity="warning" {...props}>
      <StyledAlertTitle component="h3">
        <TranslatedText stringId="medication.allergies.title" fallback="Patient allergies" />
      </StyledAlertTitle>
      <UnorderedList>
        {patientAllergies.map(({ allergy, id }) =>
          // Overly defensive guard, but preserves pre-refactor behaviour where properties of
          // `allergy` were accessed with optional chain.
          allergy != null ? (
            <li key={id}>
              <TranslatedText
                stringId={getReferenceDataStringId(allergy.id, allergy.type)}
                fallback={allergy.name}
              />
            </li>
          ) : null,
        )}
      </UnorderedList>
    </Alert>
  );
}
