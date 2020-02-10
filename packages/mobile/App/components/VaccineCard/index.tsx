import React, { PropsWithChildren, FunctionComponent, ReactElement } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { VaccineCardHeader } from './VaccineCardHeader';
import { VaccineStatus } from './VaccineStatus';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';


interface VaccineCardProps {
  vaccineData: {
    status: string,
    title: string,
    subtitle?: string,
    dateType: string,
  };
  onCloseModal: () => void ;
  onEditDetails: () => void;
  children: ReactElement;
}

const VaccineCardStyles = StyleSheet.create({
  keyboardAware: {
    flexGrow: 1,
  },
});

export const VaccineCard: FunctionComponent<PropsWithChildren<VaccineCardProps>> = ({
  vaccineData,
  onCloseModal,
  onEditDetails,
  children,
}:VaccineCardProps) => (
  <StyledView width="80.29%" borderRadius={5} background={theme.colors.WHITE}>
    <VaccineCardHeader
      vaccine={vaccineData}
      onCloseModal={onCloseModal}
      onEditDetails={onEditDetails}
    />
    <VaccineStatus status={vaccineData.status} />
    <StyledView
      paddingTop={screenPercentageToDP('2.43', Orientation.Height)}
      paddingLeft={screenPercentageToDP('2.43', Orientation.Height)}
      paddingRight={screenPercentageToDP('2.43', Orientation.Height)}
      paddingBottom={screenPercentageToDP('2.43', Orientation.Height)}
    >
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? -315 : 0}
        resetScrollToCoords={{ x: 0, y: 0 }}
        contentContainerStyle={VaccineCardStyles.keyboardAware}
        style={VaccineCardStyles.keyboardAware}
      >
        {children}
      </KeyboardAwareScrollView>
    </StyledView>
  </StyledView>
);
