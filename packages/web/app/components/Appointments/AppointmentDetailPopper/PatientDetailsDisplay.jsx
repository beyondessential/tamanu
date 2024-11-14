import React from 'react';
import { styled } from '@mui/material/styles';

import { FlexCol, InlineDetailsDisplay, Label, Title } from './SharedComponents';
import { Colors } from '../../../constants';
import { PatientNameDisplay } from '../../PatientNameDisplay';
import { TranslatedSex, TranslatedText } from '../../Translation';
import { DateDisplay } from '../../DateDisplay';

const PatientDetailsContainer = styled(FlexCol)`
  padding-block: 0.75rem 0.5rem;
  padding-inline: 0.75rem;
  gap: 0.1875rem;
  :hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
  border-top-left-radius: 0.3125rem;
  border-top-right-radius: 0.3125rem;
`;

export const PatientDetailsDisplay = ({ patient, onClick, additionalData }) => {
  const { displayId, sex, dateOfBirth } = patient;
  return (
    <PatientDetailsContainer onClick={onClick}>
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
