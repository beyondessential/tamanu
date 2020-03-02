import React, { useCallback, ReactElement } from 'react';
import { FullView, CenterView, StyledText } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';
import { disableAndroidBackButton } from '../../../../helpers/android';
import { Button } from '../../../../components/Button';
import { Routes } from '../../../../helpers/constants';
import { HomeScreenProps } from '../../../../interfaces/screens/HomeStack';

export const HomeScreen = ({ navigation }: HomeScreenProps): ReactElement => {
  disableAndroidBackButton();

  const navigateToSearchPatient = useCallback(
    () => {
      navigation.navigate(Routes.HomeStack.SearchPatientStack.name);
    },
    [],
  );

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <CenterView flex={1}>
        <StyledText color={theme.colors.WHITE}>Home</StyledText>
        <Button buttonText="Search Patient" onPress={navigateToSearchPatient} />
      </CenterView>
    </FullView>
  );
};
