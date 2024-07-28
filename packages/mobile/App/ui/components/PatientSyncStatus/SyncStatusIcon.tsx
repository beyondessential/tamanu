import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { NotMarkedForSyncIcon, MarkedForSyncIcon } from '~/ui/components/Icons';
import { StyledView } from '~/ui/styled/common';

export const SyncStatusIcon = ({ isMarkedForSync }) => {
  const CurrentStatusIcon = isMarkedForSync ? MarkedForSyncIcon : NotMarkedForSyncIcon;
  return (
    <StyledView
    >
      <CurrentStatusIcon
        size={screenPercentageToDP(4.86, Orientation.Height)}
        fill="white"
      />
    </StyledView>
  );
}
