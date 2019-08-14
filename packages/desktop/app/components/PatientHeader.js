import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { DateDisplay } from './DateDisplay';
import { DetailTable, DetailRow, FullWidthDetailRow } from './DetailTable';
import { ContentPane } from './ContentPane';

const DataList = styled.ul`
  margin: 0.5rem 1rem;
  padding: 0;
`;

const ListDisplay = React.memo(({ items = [], onEdit }) => (
  <div>
    <DataList>
      {items.length > 0 ? (
        items.map(x => <li key={x}>{x}</li>)
      ) : (
        <li style={{ opacity: 0.5 }}>None recorded</li>
      )}
    </DataList>
    <Button variant="contained" onClick={onEdit}>
      Edit
    </Button>
  </div>
));

const OngoingConditionDisplay = React.memo(({ patient }) => (
  <ListDisplay items={patient.conditions.map(x => x.name)} />
));

const AllergyDisplay = React.memo(({ patient }) => <ListDisplay items={patient.allergies} />);

const OperativePlanDisplay = React.memo(({ patient }) => (
  <ListDisplay items={patient.operativePlan} />
));

const PatientIssuesDisplay = React.memo(({ patient }) => <ListDisplay items={patient.issues} />);

export const PatientHeader = React.memo(({ patient }) => (
  <ContentPane>
    <DetailTable>
      <DetailRow label="Name" value={patient.name} />
      <DetailRow label="Sex" value={patient.sex} />
      <DetailRow label="Date of birth">
        <DateDisplay date={patient.dateOfBirth} showDuration />
      </DetailRow>
      <FullWidthDetailRow label="Ongoing conditions">
        <OngoingConditionDisplay patient={patient} />
      </FullWidthDetailRow>
      <FullWidthDetailRow label="Allergies">
        <AllergyDisplay patient={patient} />
      </FullWidthDetailRow>
      <FullWidthDetailRow label="Operative plan">
        <OperativePlanDisplay patient={patient} />
      </FullWidthDetailRow>
      <FullWidthDetailRow label="Other issues">
        <PatientIssuesDisplay patient={patient} />
      </FullWidthDetailRow>
    </DetailTable>
  </ContentPane>
));
