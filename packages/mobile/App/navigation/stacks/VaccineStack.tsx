import React, { ReactElement, useCallback } from 'react';
import {
  TransitionPresets,
  createStackNavigator,
  StackHeaderProps,
} from '@react-navigation/stack';
import { VaccineTableTabs } from './VaccineTableTabs';
import { NewVaccineTabs } from './NewVaccineTabs';
import {
  StyledText,
  CenterView,
  StyledTouchableOpacity,
  RowView,
  StyledSafeAreaView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { LeftArrow } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { VaccineModalScreen } from '../screens/vaccine/VaccineModalScreen';

const Stack = createStackNavigator();

const selectedPatient = {
  firstName: 'Ugyen',
  lastName: 'Wangdi',
};

const HeaderTitle = (): ReactElement => (
  <CenterView top="25%" position="absolute" zIndex={-1} width="100%">
    <StyledText fontSize={11} color={theme.colors.WHITE}>
      {selectedPatient.firstName} {selectedPatient.lastName}
    </StyledText>
    <StyledText color={theme.colors.WHITE} fontSize={16}>
      Vaccine
    </StyledText>
  </CenterView>
);

const Header = ({ navigation }: StackHeaderProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HomeTabs.name);
  }, []);
  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView background={theme.colors.PRIMARY_MAIN} height={70}>
        <StyledTouchableOpacity
          paddingTop={25}
          paddingLeft={25}
          paddingRight={25}
          paddingBottom={25}
          onPress={goBack}
        >
          <LeftArrow />
        </StyledTouchableOpacity>
        <HeaderTitle />
      </RowView>
    </StyledSafeAreaView>
  );
};


export const VaccineStack = (): ReactElement => (
  <Stack.Navigator headerMode="screen">
    <Stack.Screen
      options={{
        header: Header,
      }}
      name={Routes.HomeStack.VaccineStack.VaccineTabs.name}
      component={VaccineTableTabs}
    />
    <Stack.Screen
      options={{
        header: () => null,
        ...TransitionPresets.ModalSlideFromBottomIOS,
      }}
      name={Routes.HomeStack.VaccineStack.NewVaccineTabs.name}
      component={NewVaccineTabs}
    />
    <Stack.Screen
      options={{
        header: () => null,
        ...TransitionPresets.ModalSlideFromBottomIOS,
      }}
      name={Routes.HomeStack.VaccineStack.VaccineModalScreen}
      component={VaccineModalScreen}
    />
  </Stack.Navigator>
);
