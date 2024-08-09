import React, { useCallback } from 'react';
import { StyledText} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { useBackend, useBackendEffect } from '../../hooks';
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
  const [lastPull] = useBackendEffect(({ models: m }) =>
    m.LocalSystemFact.findOne({ where: { key: LAST_SUCCESSFUL_PULL } }),
  );
  const handleSyncPatient = useCallback(async (): Promise<void> => {
    await Patient.markForSync(selectedPatient.id);
    syncManager.triggerUrgentSync();
    onClose();
    onSyncPatient();
  }, [syncManager, selectedPatient, onClose, onSyncPatient]);

  if (isMarkedForSync === false) {
    return (
      <ConfirmModal
        open={open}
        onClose={onClose}
        onConfirm={handleSyncPatient}
        title={<TranslatedText
          stringId="patient.details.modal.unsynced.title"
          fallback="Sync patient?"
        />}
        confirmButtonText={<TranslatedText
          stringId="patient.details.modal.unsynced.action.sync"
          fallback="Sync patient"
        />}
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
        title={<TranslatedText
          stringId="patient.details.modal.synced.title"
          fallback="Patient sync information"
        />}
        confirmButtonText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
        />}
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
        <StyledText
          textAlign="center"
          fontSize={14}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {formattedLastPull}
        </StyledText>
      </ConfirmModal>
  );
}
