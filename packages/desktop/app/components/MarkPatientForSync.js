import React from 'react';
import { Loop } from '@material-ui/icons';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { Button } from './Button';
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

export const MarkPatientForSync = ({ patient }) => {
  const dispatch = useDispatch();
  const onMarkPatientForSync = () => dispatch(syncPatient(patient.id));
  return (
    <MarkPatientForSyncButton onClick={onMarkPatientForSync} variant="text" color="default">
      <MarkPatientForSyncIcon />
      Sync patient records
    </MarkPatientForSyncButton>
  );
};
