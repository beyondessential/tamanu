import React, { useCallback } from 'react';
import { Loop } from '@material-ui/icons';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Button } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { reloadPatient } from '../store/patient';
import { useApi } from '../api';
import { useSyncState } from '../contexts/SyncState';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

const MarkPatientForSyncButton = styled(Button)`
  background: ${Colors.white};
  height: 9rem;
  .MuiButton-label {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const MarkPatientForSyncIcon = styled(Loop)`
  font-size: 5rem;
  padding-bottom: 1rem;
`;

export const MarkPatientForSync = ({ patient }) => {
  const dispatch = useDispatch();
  const api = useApi();
  const syncState = useSyncState();
  const { facilityId } = useAuth();

  const patientId = patient.id;

  const onMarkPatientForSync = useCallback(async () => {
    const result = await api.post(`patientFacility`, { patientId, facilityId });
    dispatch(reloadPatient(patientId));
    syncState.addSyncingPatient(patientId, result.updatedAtSyncTick);
  }, [patientId, dispatch, api, syncState, facilityId]);
  return (
    <MarkPatientForSyncButton
      onClick={onMarkPatientForSync}
      variant="text"
      color="default"
      data-testid="markpatientforsyncbutton-r8n7"
    >
      <MarkPatientForSyncIcon data-testid="markpatientforsyncicon-1inl" />
      <TranslatedText
        stringId="patient.action.markForSync"
        fallback="Sync patient records"
        data-testid="translatedtext-4aj2"
      />
    </MarkPatientForSyncButton>
  );
};
