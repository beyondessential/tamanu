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

const PatientNameHeader = styled('h2')`
  max-width: 80%; /* This is to prevent the name from displaying over the edit menu */
  overflow: hidden;
  text-overflow: ellipsis;
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
    <Header onClick={onClick} tabIndex={0} data-testid="header-p2x8">
      <PatientNameHeader data-testid="h2-9n82">{getPatientNameAsString(patient)}</PatientNameHeader>
      <PrimaryDetails data-testid="primarydetails-5tdg">
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.sex.label"
              fallback="Sex"
              data-testid="translatedtext-6z93"
            />
          }
          value={<TranslatedSex sex={sex} data-testid="translatedsex-zizq" />}
          data-testid="inlinedetailsdisplay-pqhz"
        />
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
              data-testid="translatedtext-5omy"
            />
          }
          value={<DateDisplay date={dateOfBirth} noTooltip data-testid="datedisplay-qnx5" />}
          data-testid="inlinedetailsdisplay-320k"
        />
      </PrimaryDetails>
      <InlineDetailsDisplay
        label={
          <TranslatedText
            stringId="patient.details.reminderContacts.label"
            fallback="Contact"
            data-testid="translatedtext-9cmr"
          />
        }
        value={additionalData?.primaryContactNumber}
        data-testid="inlinedetailsdisplay-yceg"
      />
      <PatientId data-testid="patientid-xol3">{displayId}</PatientId>
    </Header>
  );
};
