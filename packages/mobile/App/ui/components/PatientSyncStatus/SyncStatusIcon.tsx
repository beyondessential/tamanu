import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { ColumnView, StyledText } from '~/ui/styled/common';
import { NotMarkedForSyncIcon, MarkedForSyncIcon } from '~/ui/components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const SyncStatusIcon = ({ isMarkedForSync }) => {
  const CurrentStatusIcon = isMarkedForSync ? MarkedForSyncIcon : NotMarkedForSyncIcon;
  return (
    <ColumnView alignItems="center">
      <CurrentStatusIcon
        size={screenPercentageToDP(4.86, Orientation.Height)}
        fill="white"
      />
      <StyledText
        fontSize={10}
        color="white"
        marginTop={screenPercentageToDP(-0.6, Orientation.Height)}
      >
        <TranslatedText stringId="general.action.syncData" fallback="Sync Data" />
      </StyledText>
    </ColumnView>
  );
}
