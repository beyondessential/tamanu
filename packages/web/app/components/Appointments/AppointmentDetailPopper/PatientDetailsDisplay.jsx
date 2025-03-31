import { styled } from '@mui/material/styles';
import React from 'react';

import { Colors } from '../../../constants';
import { DateDisplay } from '../../DateDisplay';
import { getPatientNameAsString } from '../../PatientNameDisplay';
import { TranslatedSex, TranslatedText } from '../../Translation';
import { InlineDetailsDisplay } from './SharedComponents';

const Header = styled('header')`
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: background-color 150ms ease;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

const H2 = styled('h2')`
  font-size: 0.875rem;
  font-weight: 500;
  margin-block: 0;
`;

const PrimaryDetails = styled('div')`
  --_gap: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--_gap);

  > * + * {
    padding-inline-start: var(--_gap);
    border-inline-start: max(0.0625rem, 1px) solid currentcolor;
  }
`;

const PatientId = styled('p')`
  color: ${Colors.primary};
  font-weight: 500;
  font-variant-numeric: lining-nums tabular-nums;
  margin-block: 0.25rem 0;
`;

export const PatientDetailsDisplay = ({ patient, onClick, additionalData }) => {
  const { displayId, sex, dateOfBirth } = patient;
  return (
    <Header onClick={onClick} tabIndex={0}>
      <H2>{getPatientNameAsString(patient)}</H2>
      <PrimaryDetails>
        <InlineDetailsDisplay
          label={<TranslatedText
            stringId="general.localisedField.sex.label"
            fallback="Sex"
            data-test-id='translatedtext-aeay' />}
          value={<TranslatedSex sex={sex} />}
        />
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
              data-test-id='translatedtext-2ji9' />
          }
          value={<DateDisplay date={dateOfBirth} noTooltip data-test-id='datedisplay-1n0g' />}
        />
      </PrimaryDetails>
      <InlineDetailsDisplay
        label={
          <TranslatedText
            stringId="patient.details.reminderContacts.label"
            fallback="Contact"
            data-test-id='translatedtext-cjq5' />
        }
        value={additionalData?.primaryContactNumber}
      />
      <PatientId>{displayId}</PatientId>
    </Header>
  );
};
