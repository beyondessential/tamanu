import React, { useCallback } from 'react';
import { StyledText} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { useBackend, useBackendEffect } from '../../hooks';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { ConfirmModal } from '../Modals/ConfirmModal';
import { Patient } from '~/models/Patient';
import { LAST_SUCCESSFUL_PULL } from '~/services/sync';

export const SyncStatusModal = ({ open, onClose, selectedPatient, isMarkedForSync }): JSX.Element => {
  const { syncManager } = useBackend();
  const [lastPull] = useBackendEffect(({ models: m }) =>
    m.LocalSystemFact.findOne({ where: { key: LAST_SUCCESSFUL_PULL } }),
  );
  const onSyncPatient = useCallback(async (): Promise<void> => {
    await Patient.markForSync(selectedPatient.id);
    syncManager.triggerUrgentSync();
    onClose();
  }, [syncManager, selectedPatient, onClose]);

  if (isMarkedForSync === false) {
    return (
      <ConfirmModal
        open={open}
        onClose={onClose}
        onConfirm={onSyncPatient}
        title={<TranslatedText
          stringId="patient.details.unsynced.modal.title"
          fallback="Sync patient?"
        />}
        confirmButtonText={<TranslatedText
          stringId="patient.details.unsynced.modal.action.sync"
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
            stringId="patient.details.unsynced.modal.description"
            fallback="This will mark this patient for sync. All encounters (past and future) will be automatically synced to this device."
          />
        </StyledText>
      </ConfirmModal>
    );
  }

  return (
    <ConfirmModal
        open={open}
        onClose={onClose}
        onConfirm={onClose}
        showCancelButton={false}
        title={<TranslatedText
          stringId="patient.details.synced.modal.title"
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
          marginTop={20}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {String(lastPull?.updatedAt)}
        </StyledText>
      </ConfirmModal>
  );
}
