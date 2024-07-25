import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { ColumnView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { PatientSyncIcon } from '~/ui/components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const PatientSyncStatus = ({ markPatientForSync }) => {
  return (
    <StyledView flex={1}>
      <StyledTouchableOpacity
        onPress={markPatientForSync}
        marginLeft={'auto'}
        marginRight={screenPercentageToDP(3.65, Orientation.Width)}
      >
        <ColumnView alignItems="center">
          <PatientSyncIcon
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
      </StyledTouchableOpacity>
    </StyledView>
  );
}
