import React from 'react';
import styled from 'styled-components';
import { useLocalisation } from '../contexts/Localisation';
import { Modal } from './Modal';
import { Colors } from '../constants';
import { TriageForm } from '../forms/TriageForm';
import { DateDisplay } from './DateDisplay';

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
  ['firstName'],
  ['lastName'],
  ['sex'],
  ['dateOfBirth', ({ dateOfBirth }) => <DateDisplay date={dateOfBirth} />],
];

export const TriageModal = React.memo(({ open, patient, onClose }) => {
  const { displayId } = patient;
  const { getLocalisation } = useLocalisation();

  const detailsFields = DETAILS_FIELD_DEFINITIONS.filter(
    ([name]) => getLocalisation(`fields.${name}.hidden`) !== true,
  ).map(([name, accessor]) => (
    <React.Fragment key={name}>
      <DetailLabel>{getLocalisation(`fields.${name}.longLabel`)}:</DetailLabel>
      <DetailValue>{accessor ? accessor(patient) : patient[name]}</DetailValue>
    </React.Fragment>
  ));

  return (
    <Modal title="New emergency triage" open={open} width="md" onClose={onClose}>
      <Header>Patient details</Header>
      <PatientDetails>
        <Grid>{detailsFields}</Grid>
        <DisplayIdLabel>{displayId}</DisplayIdLabel>
      </PatientDetails>
      <TriageForm onCancel={onClose} patient={patient} />
    </Modal>
  );
});
