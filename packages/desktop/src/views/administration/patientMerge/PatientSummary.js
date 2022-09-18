import React from 'react';
import styled from 'styled-components';

import { theme } from '../../../theme';
import { DateDisplay } from '../../../components/DateDisplay';
import { SEX_VALUE_INDEX } from '../../../constants';

const Label = styled.span`
  color: ${theme.palette.text.tertiary};
`;

const LabelledValue = ({ label, value }) => (
  <div>
    <Label>{`${label}: `}</Label>
    <span>{value}</span>
  </div>
);

const IDFrame = styled.div`
  color: ${theme.palette.primary.main};
  font-weight: bold;
`;

const IDDisplay = ({ patient, selectable, selected }) => (
  <IDFrame>
    <span title={patient.id}>{patient.displayId}</span>
    {selectable && <input type="radio" checked={selected} />}
  </IDFrame>
);

const SummaryFrame = styled.div`
  border: 1px solid ${p => (p.selected ? theme.palette.primary.main : '#ccc')};
  background: ${p => (p.selected ? 'white' : 'none')};
  padding: 1rem;
  margin-top: 1rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  *:first-child {
    flex-grow: 1;
  }

  h3 {
    margin-top: 0;
  }
`;

const Columns = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  * {
    flex-grow: 1;
  }
`;

export const PatientSummary = ({
  heading = 'Patient details',
  patient = {},
  onSelect,
  selected,
}) => (
  <SummaryFrame onClick={onSelect} selected={selected}>
    <Header>
      <h3>{heading}</h3>
      <IDDisplay patient={patient} selected={selected} selectable={onSelect} />
    </Header>
    <Columns>
      <div>
        <LabelledValue label="First name" value={patient.firstName} />
        <LabelledValue label="Last name" value={patient.lastName} />
        <LabelledValue label="Cultural name" value={patient.culturalName} />
      </div>
      <div>
        <LabelledValue label="Village" value={patient.village?.name} />
        <LabelledValue label="Sex" value={SEX_VALUE_INDEX[patient.sex]?.label} />
        <LabelledValue label="Date of birth" value={<DateDisplay date={patient.dateOfBirth} />} />
      </div>
    </Columns>
  </SummaryFrame>
);
