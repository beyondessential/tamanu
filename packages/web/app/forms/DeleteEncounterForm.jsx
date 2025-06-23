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
            <StyledFormGrid columns={2} data-testid="styledformgrid-zmie">
              <GridItem data-testid="griditem-lnay">
                <GridContent data-testid="gridcontent-pjkx">
                  <Label data-testid="label-ecib">Date</Label>
                  <Value data-testid="value-h3um">
                    <DateDisplay date={startDate} data-testid="datedisplay-nbbl" /> -{' '}
                    <DateDisplay date={endDate} data-testid="datedisplay-miju" />
                  </Value>
                  <Label data-testid="label-0frx">Type</Label>
                  <Value data-testid="value-t2jy">{currentType}</Value>
                </GridContent>
              </GridItem>
              <GridItem data-testid="griditem-umla">
                <div>
                  <Label data-testid="label-g7t4">Facility</Label>
                  <Value data-testid="value-qh5l">{facilityName}</Value>
                  <Label data-testid="label-bt8n">Reason for encounter</Label>
                  <Value data-testid="value-zj1h">{reasonForEncounter}</Value>
                </div>
              </GridItem>
            </StyledFormGrid>
            <WarningWrapper data-testid="warningwrapper-jc2f">
              <WarningTitle data-testid="warningtitle-7dbu">
                Confirm encounter deletion
              </WarningTitle>
              <Paragraph data-testid="paragraph-85nv">
                This action will delete the encounter record and all its corresponding data. This
                includes all notes, diagnoses, procedures and all other information associated with
                this encounter.
                <br />
                <br />
                This action is irreversible - to make sure you have selected the correct encounter,
                please enter the {shortLabel} for this patient to confirm deletion.
              </Paragraph>
              <NHNField
                required
                label={shortLabel}
                name="patientDisplayId"
                autoComplete="off"
                data-testid="nhnfield-n1nu"
              />
            </WarningWrapper>
            <ConfirmCancelRow
              onCancel={onCancel}
              onConfirm={submitForm}
              data-testid="confirmcancelrow-h4wb"
            />
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
      data-testid="form-g0r3"
    />
  );
};
