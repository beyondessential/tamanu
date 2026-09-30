import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

import { Button, TranslatedText, useApi } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { useAuth } from '../contexts/Auth';
import { useSyncState } from '../contexts/SyncState';
import { notifyError } from '../utils';

const MarkPatientForSyncButton = styled(Button).attrs({
  'data-testid': 'markpatientforsyncbutton-r8n7',
  color: 'inherit',
  variant: 'text',
})`
  align-items: center;
  background-color: ${p => p.theme.palette.background.paper};
  display: flex;
  flex-direction: column;
  gap: 1em;
  min-block-size: 9rem;
  min-inline-size: 10.5rem;
`;

function useMarkPatientForSyncMutation({ facilityId, patientId }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const syncState = useSyncState();

  return useMutation({
    mutationKey: ['markPatientForSync', { facilityId, patientId }],
    mutationFn: async () => await api.post('patientFacility', { facilityId, patientId }),
    onSuccess: result => {
      queryClient.invalidateQueries(['patientDetails', patientId]);
      syncState.addSyncingPatient(patientId, result.updatedAtSyncTick);
    },
    onError: error => notifyError(error.message),
  });
}

export const MarkPatientForSync = ({ patient }) => {
  const { facilityId } = useAuth();
  const { mutate: markPatientForSync, isLoading } = useMarkPatientForSyncMutation({
    patientId: patient.id,
    facilityId,
  });

  return (
    <MarkPatientForSyncButton isSubmitting={isLoading} onClick={markPatientForSync}>
      <RefreshCw data-testid="markpatientforsyncicon-1inl" />
      <TranslatedText stringId="patient.action.markForSync" fallback="Sync patient records" />
    </MarkPatientForSyncButton>
  );
};

const NotMarkedForSyncContainer = styled.div`
  background-color: ${p => p.theme.palette.background.paper};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 20px;
`;

const NotMarkedForSyncMessage = styled.p`
  align-items: center;
  background-color: ${Colors.background};
  color: ${Colors.primary};
  display: flex;
  font-weight: 500;
  justify-content: center;
  line-height: 1.5;
  margin: 0;
  min-block-size: 25rem;
  padding: 24px;
  text-align: center;
`;

// spec: MFS#marking-a-patient-for-sync-on-desktop
export const PatientNotMarkedForSync = () => (
  <NotMarkedForSyncContainer data-testid="patientnotmarkedforsync-3kq8">
    <NotMarkedForSyncMessage>
      <TranslatedText
        stringId="patient.history.notMarkedForSync"
        fallback="This patient record is not marked for sync at your facility. Please speak with your system administrator if this patient record should be synced."
      />
    </NotMarkedForSyncMessage>
  </NotMarkedForSyncContainer>
);
