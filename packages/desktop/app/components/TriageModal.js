import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { push } from 'connected-react-router';
import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { Colors } from '../constants';

import { connectApi } from '../api/connectApi';

import { TriageForm } from '../forms/TriageForm';

const PatientDetails = styled.div`
  padding: 10px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  margin-bottom: 15px;

  div:first-child {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: ${Colors.darkestText};

    span {
      background: ${Colors.primary};
      color: ${Colors.secondary};
      padding: 5px;
      border-radius: 3px;
    }
  }

  div:last-child {
    display: grid;
    grid-template-columns: 1fr 4fr;
  }
`;

const DetailLabel = styled.span`
  color: ${Colors.midText};
`;

const DetailValue = styled.span`
  color: ${Colors.darkText};
`;

const DumbTriageModal = React.memo(
  ({ open, visit, practitionerSuggester, locationSuggester, onClose, onSubmit, patient }) => {
    const { _id, firstName, lastName, sex, dateOfBirth } = patient;
    return (
      <Modal title="New Emergency Triage" open={open} width="lg" onClose={onClose}>
        <PatientDetails>
          <div>
            Patient Details<span>{_id}</span>
          </div>
          <div>
            <DetailLabel>First Name:</DetailLabel> <DetailValue>{firstName}</DetailValue>
            <DetailLabel>Last Name:</DetailLabel> <DetailValue>{lastName}</DetailValue>
            <DetailLabel>Sex:</DetailLabel> <DetailValue>{sex}</DetailValue>
            <DetailLabel>Date of Birth:</DetailLabel>
            <DetailValue>{moment(dateOfBirth).format('MM/DD/YYYY')}</DetailValue>
          </div>
        </PatientDetails>
        <TriageForm
          onSubmit={onSubmit}
          onCancel={onClose}
          visit={visit}
          practitionerSuggester={practitionerSuggester}
          locationSuggester={locationSuggester}
        />
      </Modal>
    );
  },
);

export const TriageModal = connectApi((api, dispatch, { patient }) => ({
  onSubmit: async data => {
    await api.post(`patient/${patient._id}/triages`, data);
    dispatch(push('/patients/triage'));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  locationSuggester: new Suggester(api, 'location'),
}))(DumbTriageModal);
