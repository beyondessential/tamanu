import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { push } from 'connected-react-router';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { Colors } from '../constants';

import { connectApi } from '../api/connectApi';

import { TriageForm } from '../forms/TriageForm';

import { DisplayIdLabel } from './DisplayIdLabel';

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

const DumbTriageModal = React.memo(({ open, patient, onClose, ...rest }) => {
  const { displayId, firstName, lastName, sex, dateOfBirth } = patient;
  return (
    <Modal title="New Emergency Triage" open={open} width="md" onClose={onClose}>
      <PatientDetails>
        <Header>
          <span>Patient Details</span>
          <DisplayIdLabel>{displayId}</DisplayIdLabel>
        </Header>
        <div>
          <DetailLabel>First Name:</DetailLabel> <DetailValue>{firstName}</DetailValue>
          <DetailLabel>Last Name:</DetailLabel> <DetailValue>{lastName}</DetailValue>
          <DetailLabel>Sex:</DetailLabel> <DetailValue>{sex}</DetailValue>
          <DetailLabel>Date of Birth:</DetailLabel>
          <DetailValue>{moment(dateOfBirth).format('MM/DD/YYYY')}</DetailValue>
        </div>
      </PatientDetails>
      <TriageForm onCancel={onClose} {...rest} />
    </Modal>
  );
});

export const TriageModal = connectApi((api, dispatch, { patient }) => ({
  onSubmit: async data => {
    await api.post('triage', {
      ...data,
      patientId: patient.id,
    });
    dispatch(push('/patients/triage'));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  locationSuggester: new Suggester(api, 'location'),
  triageComplaintSuggester: new Suggester(api, 'triageReason'),
}))(DumbTriageModal);
