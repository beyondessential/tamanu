import React from 'react';
import { styled } from '@mui/material/styles';

import { InlineDetailsDisplay, Label, Title } from './SharedComponents';
import { Colors } from '../../../constants';
import { PatientNameDisplay } from '../../PatientNameDisplay';
import { TranslatedSex, TranslatedText } from '../../Translation';
import { DateDisplay } from '../../DateDisplay';

const PatientDetailsContainer = styled('header')`
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  &:hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
`;

export const PatientDetailsDisplay = ({ patient, onClick, additionalData }) => {
  const { displayId, sex, dateOfBirth } = patient;
  return (
    <PatientDetailsContainer onClick={onClick} tabIndex={0}>
      <Title>
        <PatientNameDisplay patient={patient} />
      </Title>
      <span>
        <InlineDetailsDisplay
          label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
          value={<TranslatedSex sex={sex} />}
        />
        <Label>{' | '}</Label>
        <InlineDetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
            />
          }
          value={<DateDisplay date={dateOfBirth} noTooltip />}
        />
      </span>
      {additionalData?.primaryContactNumber && (
        <InlineDetailsDisplay
          label={
            <TranslatedText stringId="patient.details.reminderContacts.label" fallback="Contact" />
          }
          value={additionalData.primaryContactNumber}
        />
      )}
      <Label color={Colors.primary}>{displayId}</Label>
    </PatientDetailsContainer>
  );
};
