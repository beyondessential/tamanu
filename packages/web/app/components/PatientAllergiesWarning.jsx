import React from 'react';
import styled from 'styled-components';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { TriangleAlert } from 'lucide-react';

import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { TranslatedText } from '@tamanu/ui-components';
import { usePatientAllergiesQuery } from '../api/queries/usePatientAllergiesQuery';

const StyledAlert = styled(Alert).attrs({
  color: 'error',
  icon: <TriangleAlert />,
  severity: 'warning',
})`
  border: 1px solid ${p => p.theme.palette.error.main};
`;

const AllergyList = styled.ul`
  margin-block: 0;
  padding-inline-start: 1em;
`;

export default function PatientAllergiesWarning({ patientId, ...props }) {
  const { data, isLoading } = usePatientAllergiesQuery(patientId);
  const patientAllergies = data?.data;

  if (isLoading || !patientAllergies?.length) return null;

  return (
    <StyledAlert {...props}>
      <AlertTitle component="h3">
        <TranslatedText stringId="medication.allergies.title" fallback="Patient allergies" />
      </AlertTitle>
      <AllergyList>
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
      </AllergyList>
    </StyledAlert>
  );
}
