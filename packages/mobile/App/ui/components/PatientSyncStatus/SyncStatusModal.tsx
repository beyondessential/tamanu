import React, { useCallback } from 'react';
import { StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { syncKeys } from '~/ui/hooks/queries/queryKeys';
import { useBackend } from '../../hooks';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { ConfirmModal } from '../Modals/ConfirmModal';
import { Patient } from '~/models/Patient';
import { LAST_SUCCESSFUL_PULL } from '~/services/sync';
import { IPatient } from '~/types';
import { formatlastSuccessfulSyncTime } from '~/ui/helpers/date';

interface SyncStatusModalModalProps {
  open: boolean;
  onSyncPatient: () => void;
  onClose: () => void;
  selectedPatient: IPatient;
  isMarkedForSync: boolean;
}

export const SyncStatusModal = ({
  open,
  onSyncPatient,
  onClose,
  selectedPatient,
  isMarkedForSync,
}: SyncStatusModalModalProps): JSX.Element => {
  const { syncManager } = useBackend();
  const { data: lastPull } = useQuery({
    queryKey: syncKeys.lastSuccessfulPull(),
    queryFn: () =>
      Database.models.LocalSystemFact.findOne({ where: { key: LAST_SUCCESSFUL_PULL } }),
  });
  const { mutateAsync: markPatientForSync } = useMutation({
    mutationFn: () => Patient.markForSync(selectedPatient.id),
    onSuccess: () => {
      syncManager.triggerUrgentSync();
      onSyncPatient();
    },
  });

  const handleSyncPatient = useCallback(async (): Promise<void> => {
    await markPatientForSync();
    onClose();
  }, [markPatientForSync, onClose]);

  if (isMarkedForSync === false) {
    return (
      <ConfirmModal
        open={open}
        onClose={onClose}
        onConfirm={handleSyncPatient}
        title={
          <TranslatedText
            stringId="patient.details.modal.unsynced.title"
            fallback="Sync patient?"
          />
        }
        confirmButtonText={
          <TranslatedText
            stringId="patient.details.modal.unsynced.action.sync"
            fallback="Sync patient"
          />
        }
      >
        <StyledText
          textAlign="center"
          fontSize={14}
          marginTop={20}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          <TranslatedText
            stringId="patient.details.modal.unsynced.description"
            fallback="This will mark this patient for sync. All patient data (past and future) will be automatically synced to this device."
          />
        </StyledText>
      </ConfirmModal>
    );
  }

  const formattedLastPull = lastPull ? formatlastSuccessfulSyncTime(lastPull.updatedAt) : '';

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onClose}
      showCancelButton={false}
      title={
        <TranslatedText
          stringId="patient.details.modal.synced.title"
          fallback="Patient sync information"
        />
      }
      confirmButtonText={<TranslatedText stringId="general.action.close" fallback="Close" />}
    >
      <StyledText
        textAlign="center"
        fontSize={14}
        fontWeight={500}
        marginTop={20}
        color={theme.colors.TEXT_SUPER_DARK}
      >
        <TranslatedText
          stringId="sync.subHeading.lastSuccessfulSync"
          fallback="Last successful sync"
        />
      </StyledText>
      <StyledText textAlign="center" fontSize={14} color={theme.colors.TEXT_SUPER_DARK}>
        {formattedLastPull}
      </StyledText>
    </ConfirmModal>
  );
};
