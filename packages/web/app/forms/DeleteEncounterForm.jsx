import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import {
  ConfirmCancelRow,
  DateDisplay,
  Form,
  FormGrid,
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { Field } from '../components/Field';
import { Colors } from '../constants/styles';

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

const Paragraph = styled.p.attrs({ 'data-testid': 'paragraph-85nv' })`
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
  const { encounterType, facilityName, facilityId, startDate, endDate, reasonForEncounter } =
    encounterToDelete;

  return (
    <Form
      suppressErrorDialog
      render={({ submitForm }) => {
        return (
          <div>
            <StyledFormGrid columns={2} data-testid="styledformgrid-zmie">
              <GridItem data-testid="griditem-lnay">
                <GridContent data-testid="gridcontent-pjkx">
                  <Label data-testid="label-ecib">
                    <TranslatedText stringId="general.date.label" fallback="Date" />
                  </Label>
                  <Value data-testid="value-h3um">
                    <DateDisplay date={startDate} data-testid="datedisplay-nbbl" /> &ndash;{' '}
                    <DateDisplay date={endDate} data-testid="datedisplay-miju" />
                  </Value>
                  <Label data-testid="label-0frx">
                    <TranslatedText stringId="general.type.label" fallback="Type" />
                  </Label>
                  <Value data-testid="value-t2jy">
                    <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
                  </Value>
                </GridContent>
              </GridItem>
              <GridItem data-testid="griditem-umla">
                <div>
                  <Label data-testid="label-g7t4">
                    <TranslatedText stringId="general.facility.label" fallback="Facility" />
                  </Label>
                  <Value data-testid="value-qh5l">
                    <TranslatedReferenceData
                      category="facility"
                      fallback={facilityName}
                      value={facilityId}
                    />
                  </Value>
                  <Label data-testid="label-bt8n">
                    <TranslatedText
                      stringId="encounter.reasonForEncounter.label"
                      fallback="Reason for encounter"
                    />
                  </Label>
                  <Value data-testid="value-zj1h">{reasonForEncounter}</Value>
                </div>
              </GridItem>
            </StyledFormGrid>
            <WarningWrapper data-testid="warningwrapper-jc2f">
              <WarningTitle data-testid="warningtitle-7dbu">
                <TranslatedText
                  stringId="encounter.delete.confirmTitle"
                  fallback="Confirm encounter deletion"
                />
              </WarningTitle>
              <Paragraph>
                <TranslatedText
                  stringId="encounter.delete.warningMessage"
                  fallback="This action will delete the encounter record and all its corresponding data. This includes all notes, diagnoses, procedures and all other information associated with this encounter."
                />
              </Paragraph>
              <Paragraph>
                <TranslatedText
                  stringId="encounter.delete.confirmationPrompt"
                  fallback="This action is irreversible. To make sure you have selected the correct encounter, please enter the :shortLabel for this patient to confirm deletion."
                  replacements={{ shortLabel }}
                />
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
            message: getTranslation(
              'encounter.delete.validation.displayIdMismatch',
              ':shortLabel does not match patient record',
              { replacements: { shortLabel } },
            ),
          })
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
            />,
          ),
      })}
      onSubmit={onSubmit}
      data-testid="form-g0r3"
    />
  );
};
