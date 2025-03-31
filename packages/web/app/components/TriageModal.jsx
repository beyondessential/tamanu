import React from 'react';
import styled from 'styled-components';

import { FormModal } from './FormModal';
import { Colors } from '../constants';
import { TriageForm } from '../forms/TriageForm';
import { DateDisplay } from './DateDisplay';
import { TranslatedSex, TranslatedText } from './Translation';
import { useSettings } from '../contexts/Settings';

const Header = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  margin-bottom: 3px;
`;

const PatientDetails = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  margin-bottom: 15px;
`;

const Grid = styled.div`
  display: grid;
  margin-top: 5px;
  grid-template-columns: 100px 4fr;
  grid-column-gap: 15px;
  grid-row-gap: 10px;
`;

const DisplayIdLabel = styled.span`
  font-size: 16px;
  line-height: 21px;
  font-weight: 500;
  color: ${props => props.theme.palette.primary.main};
`;

const DetailLabel = styled.span`
  color: ${props => props.theme.palette.text.secondary};
`;

const DetailValue = styled.span`
  color: ${props => props.theme.palette.text.primary};
  text-transform: capitalize;
`;

const DETAILS_FIELD_DEFINITIONS = [
  ['firstName', 'First name'],
  ['lastName', 'Last name'],
  ['sex', 'Sex', ({ sex }) => <TranslatedSex sex={sex} />],
  ['dateOfBirth', 'Date of birth', ({ dateOfBirth }) => <DateDisplay date={dateOfBirth} data-testid='datedisplay-moct' />],
];

export const TriageModal = React.memo(
  ({ open, patient, onClose, onSubmitEncounter, noRedirectOnSubmit, initialValues }) => {
    const { displayId } = patient;
    const { getSetting } = useSettings();

    const detailsFields = DETAILS_FIELD_DEFINITIONS.filter(
      ([name]) => getSetting(`fields.${name}.hidden`) !== true,
    ).map(([name, label, accessor]) => (
      <React.Fragment key={name}>
        <DetailLabel>
          <TranslatedText
            stringId={`general.localisedFields.${name}.label`}
            fallback={label}
            data-testid='translatedtext-910k' />:
        </DetailLabel>
        <DetailValue>{accessor ? accessor(patient) : patient[name]}</DetailValue>
      </React.Fragment>
    ));

    return (
      <FormModal
        title={
          <TranslatedText
            stringId="patient.modal.triage.title"
            fallback="New emergency triage"
            data-testid='translatedtext-x9zu' />
        }
        open={open}
        width="md"
        onClose={onClose}
      >
        <Header>
          <TranslatedText
            stringId="patient.modal.triage.patientDetails.heading"
            fallback="Patient details"
            data-testid='translatedtext-ivfa' />
        </Header>
        <PatientDetails>
          <Grid>{detailsFields}</Grid>
          <DisplayIdLabel>{displayId}</DisplayIdLabel>
        </PatientDetails>
        <TriageForm
          onSubmitEncounter={onSubmitEncounter}
          noRedirectOnSubmit={noRedirectOnSubmit}
          onCancel={onClose}
          patient={patient}
          initialValues={initialValues}
        />
      </FormModal>
    );
  },
);
