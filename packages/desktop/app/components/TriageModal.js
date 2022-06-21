import React from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { push } from 'connected-react-router';

import { useLocalisation } from '../contexts/Localisation';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { Colors } from '../constants';
import { TriageForm } from '../forms/TriageForm';
import { DisplayIdLabel } from './DisplayIdLabel';
import { DateDisplay } from './DateDisplay';
import { useApi } from '../api';

const PatientDetails = styled.div`
  padding: 15px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  margin-bottom: 15px;

  div:last-child {
    display: grid;
    grid-template-columns: 1fr 4fr;
  }
`;

const DetailLabel = styled.span`
  color: ${Colors.midText};
  padding-bottom: 5px;
`;

const DetailValue = styled.span`
  color: ${Colors.darkText};
  padding-bottom: 5px;
  text-transform: capitalize;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: ${Colors.darkestText};
  margin-bottom: 20px;
`;

const DETAILS_FIELD_DEFINITIONS = [
  ['firstName'],
  ['lastName'],
  ['sex'],
  ['dateOfBirth', ({ dateOfBirth }) => <DateDisplay date={dateOfBirth} />],
];

export const TriageModal = React.memo(({ open, patient, onClose }) => {
  const { displayId } = patient;
  const api = useApi();
  const dispatch = useDispatch();
  const params = useParams();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const locationSuggester = new Suggester(api, 'location');
  const triageComplaintSuggester = new Suggester(api, 'triageReason');

  const onSubmit = async data => {
    await api.post('triage', {
      ...data,
      patientId: patient.id,
    });
    dispatch(push(`/patients/${params.category}/${patient.id}/triage`));
  };

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
    <Modal title="New Emergency Triage" open={open} width="md" onClose={onClose}>
      <PatientDetails>
        <Header>
          <span>Patient details</span>
          <DisplayIdLabel>{displayId}</DisplayIdLabel>
        </Header>
        <div>{detailsFields}</div>
      </PatientDetails>
      <TriageForm
        onCancel={onClose}
        onSubmit={onSubmit}
        triageComplaintSuggester={triageComplaintSuggester}
        practitionerSuggester={practitionerSuggester}
        locationSuggester={locationSuggester}
      />
    </Modal>
  );
});
