import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import styled from 'styled-components';

import { Field, Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { DateDisplay } from '../components/DateDisplay';

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

export const DeleteEncounterForm = ({
  onSubmit,
  onCancel,
  encounterToDelete,
  initialNewType,
  patient,
}) => {
  const { encounterType, facilityName, startDate, endDate, reasonForEncounter } = encounterToDelete;
  const currentType = ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label;

  return (
    <Form
      initialValues={{
        encounterType: initialNewType,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      render={({ submitForm, values }) => {
        return (
          <div>
            <FormGrid columns={2} $color="white">
              <GridItem>
                <GridContent>
                  <Label>Date</Label>
                  <Value>
                    <DateDisplay date={startDate} /> - <DateDisplay date={endDate} />
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
            </FormGrid>
            <WarningWrapper>
              <WarningTitle>Confirm encounter deletion</WarningTitle>
              <Paragraph>
                This action will delete the encounter record and all its corresponding data. This
                includes all notes, diagnoses, procedures and all other information associated with
                this encounter.
                <br />
                <br />
                This action is irreversible - to make sure you have selected the correct encounter,
                please enter the NHN for this patient to confirm deletion.
              </Paragraph>
              <NHNField required label="NHN" name="patientDisplayId" />
            </WarningWrapper>
            <ConfirmCancelRow onCancel={onCancel} onConfirm={submitForm} />
          </div>
        );
      }}
      validationSchema={yup.object().shape({
        patientDisplayId: yup
          .string()
          .matches(`^${patient.displayId}$`, {
            message: 'NHN does not match patient record',
          })
          .required('NHN is required'),
      })}
      onSubmit={onSubmit}
    />
  );
};
