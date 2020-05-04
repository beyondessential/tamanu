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
import { ArrowLeftIcon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { VaccineModalScreen } from '../screens/vaccine/VaccineModalScreen';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

const Stack = createStackNavigator();

const selectedPatient = {
  firstName: 'Ugyen',
  lastName: 'Wangdi',
};

const HeaderTitle = (): ReactElement => (
  <CenterView height="100%" position="absolute" zIndex={-1} width="100%">
    <StyledText
      fontSize={screenPercentageToDP(1.33, Orientation.Height)}
      color={theme.colors.WHITE}
    >
      {selectedPatient.firstName} {selectedPatient.lastName}
    </StyledText>
    <StyledText
      color={theme.colors.WHITE}
      fontSize={screenPercentageToDP(1.94, Orientation.Height)}
    >
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
      <RowView
        background={theme.colors.PRIMARY_MAIN}
        height={screenPercentageToDP(8.5, Orientation.Height)}
        alignItems="center"
      >
        <StyledTouchableOpacity
          padding={screenPercentageToDP(2.43, Orientation.Height)}
          onPress={goBack}
        >
          <ArrowLeftIcon
            size={screenPercentageToDP(2.43, Orientation.Height)}
          />
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
        ...TransitionPresets.ModalSlideFromBottomIOS,
      }}
      name={Routes.HomeStack.VaccineStack.NewVaccineTabs.name}
      component={NewVaccineTabs}
    />
    <Stack.Screen
      options={{
        ...TransitionPresets.ModalSlideFromBottomIOS,
      }}
      name={Routes.HomeStack.VaccineStack.VaccineModalScreen}
      component={VaccineModalScreen}
    />
  </Stack.Navigator>
);
