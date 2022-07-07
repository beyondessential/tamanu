import React from 'react';
import { Loop } from '@material-ui/icons';
import styled from 'styled-components';

import { Button } from './Button';
import { connectApi } from '../api';
import { Colors } from '../constants';
import { syncPatient } from '../store/patient';

const MarkPatientForSyncButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 9rem;
`;

const MarkPatientForSyncIcon = styled(Loop)`
  font-size: 5rem;
  padding-bottom: 1rem;
`;

const DumbMarkPatientForSync = ({ onMarkPatientForSync }) => (
  <MarkPatientForSyncButton onClick={onMarkPatientForSync} variant="text" color="default">
    <MarkPatientForSyncIcon />
    Sync patient records
  </MarkPatientForSyncButton>
);

export const MarkPatientForSync = connectApi((api, dispatch) => ({
  onMarkPatientForSync: () => {
    dispatch(syncPatient());
  },
}))(DumbMarkPatientForSync);
