import React, { FunctionComponent, ReactElement, useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp } from '@react-navigation/native';

import { IPatient } from '~/types';

import * as Icons from '/components/Icons';
import { theme } from '/styled/theme';
import { NewVaccineTab } from '../screens/vaccine/newVaccineTabs/NewVaccineTab';
import { VaccineTabNavigator } from '/components/TopTabNavigator/VaccineTabNavigator';
import { FullView, RowView, StyledText, StyledTouchableOpacity, StyledView } from '/styled/common';
import { ArrowLeftIcon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { VaccineDataProps } from '/components/VaccineCard';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { VaccineStatus } from '~/ui/helpers/patient';
import { CenterView } from '../../styled/common';
import { SceneRendererProps } from 'react-native-tab-view';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';

type NewVaccineHeaderProps = {
  navigation: NavigationProp<any>;
  vaccine: VaccineDataProps;
  patient: IPatient;
};

const Header = ({
  navigation,
  vaccine: { scheduledVaccineId, scheduledVaccineLabel, doseLabel },
  patient,
}: NewVaccineHeaderProps): ReactElement => {
  const onPress = useCallback(() => {
    navigation.navigate(Routes.HomeStack.VaccineStack.VaccineTabs.Index);
  }, [navigation]);
  return (
    <SafeAreaView
      style={{
        height: screenPercentageToDP(12.01, Orientation.Height),
        backgroundColor: theme.colors.PRIMARY_MAIN,
      }}
    >
      <RowView
        background={theme.colors.PRIMARY_MAIN}
        justifyContent="space-between"
        marginTop={screenPercentageToDP(1, Orientation.Height)}
      >
        <StyledView position="absolute" width="100%" top="10%" zIndex={1}>
          <StyledTouchableOpacity onPress={onPress}>
            <StyledView paddingLeft={20} paddingTop={20} paddingBottom={20} paddingRight={20}>
              <ArrowLeftIcon
                height={screenPercentageToDP(2.43, Orientation.Height)}
                width={screenPercentageToDP(2.43, Orientation.Height)}
              />
            </StyledView>
          </StyledTouchableOpacity>
        </StyledView>
        <CenterView width="100%">
          <StyledText color={theme.colors.WHITE} textAlign="center" fontSize={15}>
            {`${patient.firstName} ${patient.lastName}`}
          </StyledText>
          <StyledText color={theme.colors.WHITE} fontSize={21} fontWeight="bold">
            <TranslatedReferenceData
              value={scheduledVaccineId}
              fallback={scheduledVaccineLabel}
              category="scheduledVaccine"
            />
          </StyledText>
          <StyledText color={theme.colors.WHITE}>{doseLabel}</StyledText>
        </CenterView>
      </RowView>
    </SafeAreaView>
  );
};

type NewVaccineTabsRouteProps = RouteProp<
  {
    NewVaccineTabs: {
      vaccine: VaccineDataProps;
      patient: IPatient;
    };
  },
  'NewVaccineTabs'
>;

interface NewVaccineTabsProps {
  navigation: NavigationProp<any>;
  route: NewVaccineTabsRouteProps;
}

export const NewVaccineTabs = ({ navigation, route }: NewVaccineTabsProps): ReactElement => {
  const routes = useMemo(
    () => [
      {
        key: VaccineStatus.GIVEN,
        title: 'Given',
        vaccine: route.params.vaccine,
        color: theme.colors.SAFE,
        icon: Icons.GivenOnTimeIcon,
      },
      {
        key: VaccineStatus.NOT_GIVEN,
        title: 'Not given',
        vaccine: route.params.vaccine,
        color: theme.colors.PRIMARY_MAIN,
        icon: Icons.NotGivenIcon,
      },
    ],
    [route],
  );

  const [state, setState] = useState({
    index: route.params.vaccine.status === VaccineStatus.NOT_GIVEN ? 1 : 0,
    routes,
  });

  const scenes = {
    [VaccineStatus.GIVEN]: NewVaccineTab,
    [VaccineStatus.NOT_GIVEN]: NewVaccineTab,
  } as {
    [key: string]: FunctionComponent<SceneRendererProps>;
  };

  return (
    <FullView>
      <Header
        navigation={navigation}
        vaccine={route.params.vaccine}
        patient={route.params.patient}
      />
      <VaccineTabNavigator state={state} scenes={scenes} onChangeTab={setState} />
    </FullView>
  );
};
