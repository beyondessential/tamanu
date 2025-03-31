import React from 'react';
import styled from 'styled-components';

import { SEX_VALUE_INDEX } from '@tamanu/constants';

import { theme } from '../../../theme';
import { DateDisplay } from '../../../components/DateDisplay';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../../components/Translation';

const Label = styled.span`
  color: ${theme.palette.text.tertiary};
`;

const LabelledValue = ({ label, value }) => (
  <div>
    <Label>
      {label}
      {': '}
    </Label>
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
    {selectable && <input type="radio" checked={selected} data-testid='input-xrh3' />}
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
      <h3 data-testid='h3-j0yi'>{heading}</h3>
      <IDDisplay patient={patient} selected={selected} selectable={onSelect} />
    </Header>
    <Columns>
      <div>
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-testid='translatedtext-b7os' />
          }
          value={patient.firstName}
          data-testid='labelledvalue-kyks' />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-testid='translatedtext-j01y' />
          }
          value={patient.lastName}
          data-testid='labelledvalue-nnhs' />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.culturalName.label"
              fallback="Cultural name"
              data-testid='translatedtext-ehvp' />
          }
          value={patient.culturalName}
          data-testid='labelledvalue-6yz7' />
      </div>
      <div>
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.village.label"
              fallback="Village"
              data-testid='translatedtext-ee2i' />
          }
          value={patient.village
            && <TranslatedReferenceData
            fallback={patient.village.name}
            value={patient.village.id}
            category="village"
            data-testid='translatedreferencedata-w05t' />
          }
          data-testid='labelledvalue-2aif' />
        <LabelledValue
          label={<TranslatedText
            stringId="general.localisedField.sex.label"
            fallback="Sex"
            data-testid='translatedtext-8488' />}
          value={SEX_VALUE_INDEX[patient.sex]?.label}
          data-testid='labelledvalue-dlc9' />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label"
              fallback="Date of birth"
              data-testid='translatedtext-4wap' />
          }
          value={<DateDisplay date={patient.dateOfBirth} data-testid='datedisplay-1f2z' />}
          data-testid='labelledvalue-898n' />
      </div>
    </Columns>
  </SummaryFrame>
);
