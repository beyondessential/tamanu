import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import usePatientIsMarkedForSyncQuery from '~/ui/hooks/queries/usePatientIsMarkedForSyncQuery';
import { SyncStatusModal } from './SyncStatusModal';
import { SyncStatusIcon } from './SyncStatusIcon';
import { IPatient } from '~/types';

interface PatientSyncStatusProps {
  selectedPatient: IPatient;
}

export const PatientSyncStatus = ({ selectedPatient }: PatientSyncStatusProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: isMarkedForSync, isPending: isLoading } = usePatientIsMarkedForSyncQuery(
    selectedPatient.id,
  );

  if (isLoading) {
    return <StyledView flex={1} />;
  }


  return (
    <>
      <SyncStatusModal
        open={isOpen}
        onSyncPatient={() =>
          queryClient.invalidateQueries({ queryKey: patientKeys.syncStatus(selectedPatient.id) })
        }
        onClose={() => setIsOpen(false)}
        selectedPatient={selectedPatient}
        isMarkedForSync={isMarkedForSync}
      />
      <StyledView flex={1}>
        <StyledTouchableOpacity
          onPress={() => setIsOpen(true)}
          marginLeft={'auto'}
          marginRight={screenPercentageToDP(3.65, Orientation.Width)}
        >
          <SyncStatusIcon isMarkedForSync={isMarkedForSync} />
        </StyledTouchableOpacity>
      </StyledView>
    </>
  );
};
