import React from 'react';
import styled from 'styled-components';
import { TriangleAlert } from 'lucide-react';

import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { usePatientAllergiesQuery } from '../api/queries/usePatientAllergiesQuery';
import { BodyText } from '../components';

const Root = styled.div`
  align-items: center;
  background-color: ${TAMANU_COLORS.lightAlert};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.error.main};
  column-gap: 0.75em;
  display: grid;
  font-size: 14px;
  grid-column: 1 / -1;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  padding-block: 10px;
  padding-inline: 16px;
`;

const AllergiesWarningTitle = styled(BodyText)`
  color: ${p => p.theme.palette.text.primary};
  font-weight: 500;
`;

const AllergiesList = styled.ul`
  color: ${p => p.theme.palette.text.primary};
  font-size: 14px;
  line-height: 1.4;
  list-style-type: disc;
  margin: 0;
  grid-column-start: 2;
  padding-inline-start: 1em;
`;

export default function PatientAllergiesWarning({ patientId, ...props }) {
  const { data, isLoading } = usePatientAllergiesQuery(patientId);
  const patientAllergies = data?.data;

  if (isLoading || !patientAllergies?.length) return null;

  return (
    <Root {...props}>
      <TriangleAlert color={TAMANU_COLORS.alert} />
      <AllergiesWarningTitle>
        <TranslatedText stringId="medication.allergies.title" fallback="Patient allergies" />
      </AllergiesWarningTitle>
      <AllergiesList>
        {patientAllergies.map(({ allergy }) => (
          <li key={allergy.id}>
            <TranslatedText
              stringId={getReferenceDataStringId(allergy.id, allergy.type)}
              fallback={allergy.name}
            />
          </li>
        ))}
      </AllergiesList>
    </Root>
  );
}
