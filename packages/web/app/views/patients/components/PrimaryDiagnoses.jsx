import React from 'react';
import styled from 'styled-components';

import { DIAGNOSIS_CERTAINTY } from '@tamanu/constants';
import { Colors } from '../../../constants/styles';
import { DiagnosisCertaintyTag } from '../../../components/DiagnosisCertaintyTag';
import { TranslatedReferenceData, TranslatedText } from '../../../components/Translation';

// Listed in this order, then alphabetically by diagnosis within each certainty.
const DISPLAYED_CERTAINTIES = [
  DIAGNOSIS_CERTAINTY.CONFIRMED,
  DIAGNOSIS_CERTAINTY.EMERGENCY,
  DIAGNOSIS_CERTAINTY.SUSPECTED,
];

// A diagnosis's reference data can be missing, such as when it has been deleted or has yet to sync.
const getDiagnosisName = ({ diagnosis }) => diagnosis?.name ?? '';

const getDisplayedPrimaryDiagnoses = diagnoses =>
  diagnoses
    .filter(({ isPrimary, certainty }) => isPrimary && DISPLAYED_CERTAINTIES.includes(certainty))
    .sort(
      (a, b) =>
        DISPLAYED_CERTAINTIES.indexOf(a.certainty) - DISPLAYED_CERTAINTIES.indexOf(b.certainty) ||
        getDiagnosisName(a).localeCompare(getDiagnosisName(b)),
    );

const ROW_HEIGHT = '28px';
const DIVIDER_SPACING = '12px';

const Section = styled.div`
  background-color: ${Colors.white};
  border-bottom: 1px solid ${Colors.softOutline};
  padding: 20px 25px;
`;

const Container = styled.div`
  display: flex;
  gap: 16px;
  border: 1px solid ${Colors.primary};
  border-radius: 5px;
  padding: 12px 16px;
  font-size: 14px;
`;

const Label = styled.span`
  color: ${Colors.midText};
  line-height: ${ROW_HEIGHT};
  white-space: nowrap;
`;

// Each diagnosis has a divider before it, and the list is pulled left by the divider and its
// spacing so that this clips the divider before whichever diagnosis starts a line. Dividers then
// only show between diagnoses on the same line.
const ListClip = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const List = styled.ul.attrs({ role: 'list' })`
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
  margin-inline-start: calc(-2 * ${DIVIDER_SPACING} - 1px);
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: ${ROW_HEIGHT};
  margin-inline-start: ${DIVIDER_SPACING};
  padding-inline-start: ${DIVIDER_SPACING};
  border-inline-start: 1px solid ${Colors.outline};
  color: ${Colors.darkestText};
  font-weight: 500;
`;

/**
 * The encounter's primary diagnoses, shown above the encounter's tabs whichever is selected.
 *
 * Shows nothing when there are none to list, including for a user who cannot list diagnoses, as
 * the encounter is then loaded without any.
 */
export const PrimaryDiagnoses = React.memo(({ diagnoses }) => {
  const displayedDiagnoses = getDisplayedPrimaryDiagnoses(diagnoses);
  if (displayedDiagnoses.length === 0) return null;

  return (
    <Section data-testid="section-primary-diagnoses">
      <Container>
        <Label>
          <TranslatedText
            stringId="encounter.diagnosis.type.primary.full"
            fallback="Primary diagnosis"
            data-testid="translatedtext-primary-diagnoses-label"
          />
          :
        </Label>
        <ListClip>
          <List data-testid="list-primary-diagnoses">
            {displayedDiagnoses.map(({ id, diagnosis, certainty }) => (
              <Item key={id} data-testid={`item-primary-diagnosis-${id}`}>
                {diagnosis && (
                  <TranslatedReferenceData
                    fallback={diagnosis.name}
                    value={diagnosis.id}
                    category="diagnosis"
                    data-testid="translatedreferencedata-primary-diagnosis"
                  />
                )}
                <DiagnosisCertaintyTag
                  certainty={certainty}
                  data-testid="diagnosiscertaintytag-primary-diagnosis"
                />
              </Item>
            ))}
          </List>
        </ListClip>
      </Container>
    </Section>
  );
});
