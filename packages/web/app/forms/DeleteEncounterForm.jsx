import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Field, Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { DateDisplay } from '../components/DateDisplay';
import { useTranslation } from '../contexts/Translation';

const Label = styled.div`
  font-size: 14px;
  color: grey;
`;

const Value = styled.div`
  padding-bottom: 20px;
  font-weight: bold;
`;

const GridItem = styled.div`
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 24px;
`;

const GridContent = styled.div`
  border-right: 1px solid ${Colors.outline};
`;

const WarningTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${Colors.alert};
`;

const Paragraph = styled.p`
  font-size: 14px;
`;

const WarningWrapper = styled.div`
  padding-top: 30px;
  padding-bottom: 40px;
`;

const NHNField = styled(Field)`
  width: 300px;
`;

const StyledFormGrid = styled(FormGrid)`
  background-color: white;
`;

export const DeleteEncounterForm = ({ onSubmit, onCancel, encounterToDelete, patient }) => {
  const { getTranslation } = useTranslation();
  const shortLabel = getTranslation('general.localisedField.displayId.label.short', 'NHN');
  const { encounterType, facilityName, startDate, endDate, reasonForEncounter } = encounterToDelete;
  const currentType = ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;

  return (
    <Form
      suppressErrorDialog
      render={({ submitForm }) => {
        return (
          <div>
            <StyledFormGrid columns={2}>
              <GridItem>
                <GridContent>
                  <Label>Date</Label>
                  <Value>
                    <DateDisplay date={startDate} data-testid='datedisplay-4mv8' /> - <DateDisplay date={endDate} data-testid='datedisplay-zz4k' />
                  </Value>
                  <Label>Type</Label>
                  <Value>{currentType}</Value>
                </GridContent>
              </GridItem>
              <GridItem>
                <div>
                  <Label>Facility</Label>
                  <Value>{facilityName}</Value>
                  <Label>Reason for encounter</Label>
                  <Value>{reasonForEncounter}</Value>
                </div>
              </GridItem>
            </StyledFormGrid>
            <WarningWrapper>
              <WarningTitle>Confirm encounter deletion</WarningTitle>
              <Paragraph>
                This action will delete the encounter record and all its corresponding data. This
                includes all notes, diagnoses, procedures and all other information associated with
                this encounter.
                <br />
                <br />
                This action is irreversible - to make sure you have selected the correct encounter,
                please enter the {shortLabel} for this patient to confirm deletion.
              </Paragraph>
              <NHNField required label={shortLabel} name="patientDisplayId" autoComplete="off" />
            </WarningWrapper>
            <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} />
          </div>
        );
      }}
      validationSchema={yup.object().shape({
        patientDisplayId: yup
          .string()
          .matches(`^${patient.displayId}$`, {
            message: `${shortLabel} does not match patient record`,
          })
          .required(`${shortLabel} is required`),
      })}
      onSubmit={onSubmit}
    />
  );
};
