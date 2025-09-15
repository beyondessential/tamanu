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
    <Label data-testid="label-3uzp">
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
  <IDFrame data-testid="idframe-hazx">
    <span title={patient.id}>{patient.displayId}</span>
    {selectable && <input type="radio" checked={selected} data-testid="input-dw3y" />}
  </IDFrame>
);

const SummaryFrame = styled.div`
  border: 1px solid ${(p) => (p.selected ? theme.palette.primary.main : '#ccc')};
  background: ${(p) => (p.selected ? 'white' : 'none')};
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
  <SummaryFrame onClick={onSelect} selected={selected} data-testid="summaryframe-887h">
    <Header data-testid="header-hy4l">
      <h3>{heading}</h3>
      <IDDisplay
        patient={patient}
        selected={selected}
        selectable={onSelect}
        data-testid="iddisplay-nrzi"
      />
    </Header>
    <Columns data-testid="columns-d8w2">
      <div>
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-testid="translatedtext-k8pw"
            />
          }
          value={patient.firstName}
          data-testid="labelledvalue-oks3"
        />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-testid="translatedtext-acm1"
            />
          }
          value={patient.lastName}
          data-testid="labelledvalue-dp1f"
        />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.culturalName.label"
              fallback="Cultural/traditional name"
              data-testid="translatedtext-w1p2"
            />
          }
          value={patient.culturalName}
          data-testid="labelledvalue-4e9p"
        />
      </div>
      <div>
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.village.label"
              fallback="Village"
              data-testid="translatedtext-rj8j"
            />
          }
          value={
            patient.village && (
              <TranslatedReferenceData
                fallback={patient.village.name}
                value={patient.village.id}
                category="village"
                data-testid="translatedreferencedata-dqrx"
              />
            )
          }
          data-testid="labelledvalue-rsjt"
        />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.sex.label"
              fallback="Sex"
              data-testid="translatedtext-av8b"
            />
          }
          value={SEX_VALUE_INDEX[patient.sex]?.label}
          data-testid="labelledvalue-nzz5"
        />
        <LabelledValue
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label"
              fallback="Date of birth"
              data-testid="translatedtext-gj0y"
            />
          }
          value={<DateDisplay date={patient.dateOfBirth} data-testid="datedisplay-u395" />}
          data-testid="labelledvalue-f6ji"
        />
      </div>
    </Columns>
  </SummaryFrame>
);
