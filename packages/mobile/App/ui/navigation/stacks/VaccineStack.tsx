import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { createStackNavigator, StackHeaderProps, TransitionPresets } from '@react-navigation/stack';
import { VaccineTableTabs } from './VaccineTableTabs';
import { NewVaccineTabs } from './NewVaccineTabs';
import {
  CenterView,
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
} from '/styled/common';
import { theme } from '/styled/theme';
import { ArrowLeftIcon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { VaccineModalScreen } from '../screens/vaccine/VaccineModalScreen';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { withPatient } from '~/ui/containers/Patient';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Stack = createStackNavigator();

const HeaderTitleComponent = ({ selectedPatient }): ReactElement => (
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
      <TranslatedText stringId="patient.vaccine.title" fallback="Vaccine" />
    </StyledText>
  </CenterView>
);

const HeaderTitle = compose(withPatient)(HeaderTitleComponent);

const Header = ({ navigation }: StackHeaderProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HomeTabs.Index);
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
          <ArrowLeftIcon size={screenPercentageToDP(2.43, Orientation.Height)} />
        </StyledTouchableOpacity>
        <HeaderTitle />
      </RowView>
    </StyledSafeAreaView>
  );
};

export const VaccineStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        options={{
          header: Header,
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Index}
        component={VaccineTableTabs}
      />
      <Stack.Screen
        options={{
          header: (): null => null,
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
        name={Routes.HomeStack.VaccineStack.NewVaccineTabs.Index}
        component={NewVaccineTabs}
      />
      <Stack.Screen
        options={{
          header: (): null => null,
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
        name={Routes.HomeStack.VaccineStack.VaccineModalScreen}
        component={VaccineModalScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
