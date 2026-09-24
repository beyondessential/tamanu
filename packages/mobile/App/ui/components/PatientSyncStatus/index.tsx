import React from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { patientKeys, syncKeys } from '~/ui/hooks/queries/queryKeys';
import usePatientIsMarkedForSyncQuery from '~/ui/hooks/queries/usePatientIsMarkedForSyncQuery';
import { useBackend } from '~/ui/hooks';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Database } from '~/infra/db';
import { Patient } from '~/models/Patient';
import { LAST_SUCCESSFUL_PULL } from '~/services/sync';
import { formatlastSuccessfulSyncTime } from '~/ui/helpers/date';
import { SyncStatusIcon } from './SyncStatusIcon';
import type { IPatient } from '~/types';

interface PatientSyncStatusProps {
  selectedPatient: IPatient;
}

export const PatientSyncStatus = ({ selectedPatient }: PatientSyncStatusProps): JSX.Element => {
  const queryClient = useQueryClient();
  const { syncManager } = useBackend();
  const { getTranslation } = useTranslation();
  const { data: isMarkedForSync, isPending: isLoading } = usePatientIsMarkedForSyncQuery(
    selectedPatient.id,
  );
  const { data: lastPull } = useQuery({
    queryKey: syncKeys.lastSuccessfulPull(),
    queryFn: () =>
      Database.models.LocalSystemFact.findOne({
        where: { key: LAST_SUCCESSFUL_PULL },
        select: ['updatedAt'],
      }),
  });
  const { mutate: markPatientForSync } = useMutation({
    mutationFn: () => Patient.markForSync(selectedPatient.id),
    onSuccess: () => {
      syncManager.triggerUrgentSync();
      queryClient.invalidateQueries({ queryKey: patientKeys.syncStatus(selectedPatient.id) });
    },
  });

  const confirmSyncPatient = () => {
    Alert.alert(
      getTranslation('patient.details.modal.unsynced.title', 'Sync patient?'),
      getTranslation(
        'patient.details.modal.unsynced.description',
        'This will mark this patient for sync. All patient data (past and future) will be automatically synced to this device.',
      ),
      [
        { text: getTranslation('general.action.cancel', 'Cancel'), style: 'cancel' },
        {
          text: getTranslation('patient.details.modal.unsynced.action.sync', 'Sync patient'),
          onPress: () => markPatientForSync(),
        },
      ],
    );
  };

  const showSyncInformation = () => {
    const lastSuccessfulSyncLabel = getTranslation(
      'sync.subHeading.lastSuccessfulSync',
      'Last successful sync',
    );
    const formattedLastPull = lastPull ? formatlastSuccessfulSyncTime(lastPull.updatedAt) : '';
    Alert.alert(
      getTranslation('patient.details.modal.synced.title', 'Patient sync information'),
      `${lastSuccessfulSyncLabel}\n${formattedLastPull}`,
      [{ text: getTranslation('general.action.close', 'Close') }],
    );
  };

  if (isLoading) {
    return <StyledView flex={1} />;
  }

  return (
    <StyledView flex={1}>
      <StyledTouchableOpacity
        onPress={isMarkedForSync === false ? confirmSyncPatient : showSyncInformation}
        marginLeft={'auto'}
        marginRight={screenPercentageToDP(3.65, Orientation.Width)}
      >
        <SyncStatusIcon isMarkedForSync={isMarkedForSync} />
      </StyledTouchableOpacity>
    </StyledView>
  );
};
