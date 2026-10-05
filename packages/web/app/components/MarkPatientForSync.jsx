import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

import { Button, TranslatedText, useApi } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { useSyncState } from '../contexts/SyncState';
import { notifyError } from '../utils';

const MarkPatientForSyncButton = styled(Button).attrs({
  'data-testid': 'markpatientforsyncbutton-r8n7',
  color: 'default',
  variant: 'text',
})`
  align-items: center;
  background-color: ${p => p.theme.palette.background.paper};
  display: flex;
  flex-direction: column;
  gap: 1em;
  min-block-size: 9rem;
  min-inline-size: 10.5rem;
  .MuiButton-label {
    display: contents;
  }
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
