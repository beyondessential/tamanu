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
  ['sex', 'Sex', ({ sex }) => <TranslatedSex sex={sex} data-testid="translatedsex-eirc" />],
  [
    'dateOfBirth',
    'Date of birth',
    ({ dateOfBirth }) => <DateDisplay date={dateOfBirth} data-testid="datedisplay-78p2" />,
  ],
];

export const TriageModal = React.memo(
  ({
    open,
    patient,
    onClose,
    onSubmitEncounter,
    noRedirectOnSubmit,
    initialValues,
    withExistingEncounterCheck,
  }) => {
    const { displayId } = patient;
    const { getSetting } = useSettings();

    const detailsFields = DETAILS_FIELD_DEFINITIONS.filter(
      ([name]) => getSetting(`fields.${name}.hidden`) !== true,
    ).map(([name, label, accessor]) => (
      <React.Fragment key={name}>
        <DetailLabel data-testid={`detaillabel-l4mb-${name}`}>
          <TranslatedText
            stringId={`general.localisedField.${name}.label`}
            fallback={label}
            data-testid={`translatedtext-ef2v-${name}`}
          />
          :
        </DetailLabel>
        <DetailValue data-testid={`detailvalue-lsjb-${name}`}>
          {accessor ? accessor(patient) : patient[name]}
        </DetailValue>
      </React.Fragment>
    ));

    return (
      <FormModal
        title={
          <TranslatedText
            stringId="patient.modal.triage.title"
            fallback="New emergency triage"
            data-testid="translatedtext-3ejb"
          />
        }
        open={open}
        width="md"
        onClose={onClose}
        data-testid="formmodal-v42d"
      >
        <Header data-testid="header-fvav">
          <TranslatedText
            stringId="patient.modal.triage.patientDetails.heading"
            fallback="Patient details"
            data-testid="translatedtext-kxn4"
          />
        </Header>
        <PatientDetails data-testid="patientdetails-pdbh">
          <Grid data-testid="grid-jaa1">{detailsFields}</Grid>
          <DisplayIdLabel data-testid="displayidlabel-upiz">{displayId}</DisplayIdLabel>
        </PatientDetails>
        <TriageForm
          onSubmitEncounter={async data =>
            withExistingEncounterCheck(async () => onSubmitEncounter(data))
          }
          noRedirectOnSubmit={noRedirectOnSubmit}
          onCancel={onClose}
          patient={patient}
          initialValues={initialValues}
          data-testid="triageform-ldgl"
          withExistingEncounterCheck={withExistingEncounterCheck}
        />
      </FormModal>
    );
  },
);
