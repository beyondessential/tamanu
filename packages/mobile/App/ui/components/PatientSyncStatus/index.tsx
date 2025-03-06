import React, { useState } from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { useBackendEffect } from '../../hooks';
import { readConfig } from '~/services/config';
import { SyncStatusModal } from './SyncStatusModal';
import { SyncStatusIcon } from './SyncStatusIcon';
import { IPatient } from '~/types';
import { useRefreshCount } from '~/ui/hooks/useRefreshCount';

interface PatientSyncStatusProps {
  selectedPatient: IPatient;
}

export const PatientSyncStatus = ({ selectedPatient }: PatientSyncStatusProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [patientFacility, , isLoading] = useBackendEffect(
    async ({ models: m }) =>
      m.PatientFacility.findOne({
        where: {
          patient: { id: selectedPatient.id },
          facility: { id: await readConfig('facilityId', '') },
        },
      }),
    [refreshCount],
  );

  if (isLoading) {
    return <StyledView flex={1} />;
  }

  const isMarkedForSync = Boolean(patientFacility);

  return (
    <>
      <SyncStatusModal
        open={isOpen}
        onSyncPatient={updateRefreshCount}
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
