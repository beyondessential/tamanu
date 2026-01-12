import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { SEX_VALUE_INDEX } from '@tamanu/constants';

import { Colors } from '../constants';
import { DateOnlyDisplay } from '.';
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
  color: ${(props) => props.theme.palette.text.tertiary};
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
  color: ${(props) => props.theme.palette.text.secondary};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props} data-testid="cardcell-kiqd">
    <CardLabel data-testid="cardlabel-ew60">{label}</CardLabel>
    <CardValue data-testid="cardvalue-xte9">{value}</CardValue>
  </CardCell>
);

export const PatientDetailsCard = ({ patient }) => (
  <Card mb={4} data-testid="card-z5eu">
    <Column data-testid="column-ka13">
      <CardItem
        label={
          <TranslatedText
            stringId="general.patientId.label"
            fallback="Patient ID"
            data-testid="translatedtext-dxyi"
          />
        }
        value={patient?.displayId}
        data-testid="carditem-ij6h"
      />
      <CardItem
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid="translatedtext-hmo0"
          />
        }
        value={patient?.firstName}
        data-testid="carditem-5i8y"
      />
      <CardItem
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-6wf8"
          />
        }
        value={patient?.lastName}
        data-testid="carditem-2zmk"
      />
    </Column>
    <Column data-testid="column-tjs7">
      <CardItem
        label={
          <TranslatedText
            stringId="patient.detail.card.dateOfBirth.label.short"
            fallback="DOB"
            data-testid="translatedtext-0qfs"
          />
        }
        value={<DateOnlyDisplay date={patient?.dateOfBirth} data-testid="datedisplay-h1tz" />}
        data-testid="carditem-mm6v"
      />
      <CardItem
        label={
          <TranslatedText
            stringId="general.localisedField.sex.label"
            fallback="Sex"
            data-testid="translatedtext-75mt"
          />
        }
        value={SEX_VALUE_INDEX[patient?.sex]?.label}
        data-testid="carditem-i7lc"
      />
    </Column>
  </Card>
);
