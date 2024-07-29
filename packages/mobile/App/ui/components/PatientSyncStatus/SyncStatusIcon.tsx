import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { NotMarkedForSyncIcon, MarkedForSyncIcon } from '~/ui/components/Icons';
import { StyledView } from '~/ui/styled/common';

interface SyncStatusIconProps {
  isMarkedForSync: boolean;
}

export const SyncStatusIcon = ({ isMarkedForSync }: SyncStatusIconProps) => {
  const CurrentStatusIcon = isMarkedForSync ? MarkedForSyncIcon : NotMarkedForSyncIcon;
  return (
    <StyledView
      alignItems="center"
      paddingTop={screenPercentageToDP(0.8, Orientation.Height)}
      paddingRight={screenPercentageToDP(1.6, Orientation.Width)}
    >
      <CurrentStatusIcon
        size={screenPercentageToDP(4.86, Orientation.Height)}
        fill="white"
      />
    </StyledView>
  );
}
