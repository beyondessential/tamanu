import React from 'react';
import styled from 'styled-components';
import { TriangleAlert } from 'lucide-react';

import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { usePatientAllergiesQuery } from '../api/queries/usePatientAllergiesQuery';

const Article = styled.article`
  align-items: center;
  background-color: ${TAMANU_COLORS.lightAlert};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.error.main};
  color: ${p => p.theme.palette.text.primary};
  column-gap: 0.75em;
  display: grid;
  font-size: 14px;
  grid-column: 1 / -1;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  line-height: 1.4;
  padding-block: 10px;
  padding-inline: 16px;
`;

const Heading = styled.h3`
  font-size: inherit;
  font-weight: 500;
  margin-block: 0;
`;

const UnorderedList = styled.ul`
  grid-column-start: 2;
  margin-block: 0;
  padding-inline-start: 1em;
`;

export default function PatientAllergiesWarning({ patientId, ...props }) {
  const { data, isLoading } = usePatientAllergiesQuery(patientId);
  const patientAllergies = data?.data;

  if (isLoading || !patientAllergies?.length) return null;

  return (
    <Article {...props}>
      <TriangleAlert color={TAMANU_COLORS.alert} />
      <Heading>
        <TranslatedText stringId="medication.allergies.title" fallback="Patient allergies" />
      </Heading>
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
    </Article>
  );
}
