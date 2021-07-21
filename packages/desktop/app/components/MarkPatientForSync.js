import React from 'react';
import { Loop } from '@material-ui/icons';
import styled from 'styled-components';

import { Button } from './Button';
import { connectApi } from '../api';
import { Colors } from '../constants';
import { reloadPatient, waitForSync } from '../store/patient';

const MarkPatientForSyncButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 9rem;
  margin: 1rem;
`;

const MarkPatientForSyncIcon = styled(Loop)`
  font-size: 5rem;
  padding-bottom: 1rem;
`;

const DumbMarkPatientForSync = ({ onMarkPatientForSync }) => {
  return (
    <MarkPatientForSyncButton onClick={onMarkPatientForSync}>
      <MarkPatientForSyncIcon />
      Sync patient records
    </MarkPatientForSyncButton>
  );
};

export const MarkPatientForSync = connectApi((api, dispatch, { patient }) => ({
  onMarkPatientForSync: async () => {
    dispatch(waitForSync());
    await api.put(`patient/${patient.id}`, { markedForSync: true });
    dispatch(reloadPatient(patient.id));
    // heuristically wait for 25 seconds to sync patients
    await new Promise(resolve => setTimeout(resolve, 25000));
    dispatch(waitForSync(false));
  },
}))(DumbMarkPatientForSync);
