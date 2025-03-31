import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { SEX_VALUE_INDEX } from '@tamanu/constants';

import { Colors } from '../constants';
import { DateDisplay } from '.';
import { TranslatedText } from './Translation/TranslatedText';

const Card = styled(Box)`
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  padding: 20px 10px;
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
`;

const Column = styled.div`
  flex: 1;
  padding-left: 20px;

  :first-of-type {
    border-right: 1px solid ${Colors.outline};
  }
`;

const CardCell = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CardLabel = styled.div`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);

export const PatientDetailsCard = ({ patient }) => (
  <Card mb={4}>
    <Column>
      <CardItem
        label={<TranslatedText
          stringId="general.patientId.label"
          fallback="Patient ID"
          data-testid='translatedtext-c5od' />}
        value={patient?.displayId}
        data-testid='carditem-zi6t' />
      <CardItem
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid='translatedtext-zzat' />
        }
        value={patient?.firstName}
        data-testid='carditem-yvpq' />
      <CardItem
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid='translatedtext-mind' />
        }
        value={patient?.lastName}
        data-testid='carditem-qmr3' />
    </Column>
    <Column>
      <CardItem
        label={
          <TranslatedText
            stringId="patient.detail.card.dateOfBirth.label.short"
            fallback="DOB"
            data-testid='translatedtext-cwnq' />
        }
        value={<DateDisplay date={patient?.dateOfBirth} data-testid='datedisplay-6uur' />}
        data-testid='carditem-pz38' />
      <CardItem
        label={<TranslatedText
          stringId="general.localisedField.sex.label"
          fallback="Sex"
          data-testid='translatedtext-lbs8' />}
        value={SEX_VALUE_INDEX[patient?.sex]?.label}
        data-testid='carditem-atol' />
    </Column>
  </Card>
);
