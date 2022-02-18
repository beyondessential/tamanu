import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import * as Icons from '/components/Icons';
import { theme } from '/styled/theme';
import { NewVaccineTab } from '../screens/vaccine/newVaccineTabs/NewVaccineTab';
import { VaccineTabNavigator } from '/components/TopTabNavigator/VaccineTabNavigator';
import {
  FullView,
  RowView,
  StyledView,
  StyledText,
  StyledTouchableOpacity,
} from '/styled/common';
import { ArrowDownIcon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { VaccineDataProps } from '/components/VaccineCard';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { VaccineStatus } from '~/ui/helpers/patient';

type NewVaccineHeaderProps = {
  navigation: NavigationProp<any>;
  vaccine: VaccineDataProps;
};

const Header = ({
  navigation,
  vaccine,
}: NewVaccineHeaderProps): ReactElement => {
  const onPress = useCallback(() => {
    navigation.navigate(Routes.HomeStack.VaccineStack.VaccineTabs.Index);
  }, []);
  return (
    <SafeAreaView
      style={{
        height: screenPercentageToDP(17.01, Orientation.Height),
        backgroundColor: theme.colors.PRIMARY_MAIN,
      }}
    >
      <RowView
        height={screenPercentageToDP(12.15, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        justifyContent="space-between"
      >
        <StyledView height="100%" justifyContent="center" paddingLeft={20}>
          <StyledText
            color={theme.colors.WHITE}
            fontSize={21}
            fontWeight="bold"
          >
            {vaccine.name}
          </StyledText>
          <StyledText color={theme.colors.SECONDARY_MAIN} fontSize={21}>
            {vaccine.code}
          </StyledText>
          <StyledText color={theme.colors.WHITE}>{vaccine.schedule}</StyledText>
        </StyledView>
        <StyledView
          position="absolute"
          width="100%"
          alignItems="center"
          top="10%"
        >
          <StyledTouchableOpacity onPress={onPress}>
            <ArrowDownIcon size={15} fill={theme.colors.WHITE} stroke={3} />
          </StyledTouchableOpacity>
        </StyledView>
      </RowView>
    </SafeAreaView>
  );
};

type NewVaccineTabsRouteProps = RouteProp<
  {
    NewVaccineTabs: {
      vaccine: VaccineDataProps;
    };
  },
  'NewVaccineTabs'
>;

interface NewVaccineTabsProps {
  navigation: NavigationProp<any>;
  route: NewVaccineTabsRouteProps;
}

export const NewVaccineTabs = ({
  navigation,
  route,
}: NewVaccineTabsProps): ReactElement => {
  const routes = useMemo(
    () => [
      {
        key: VaccineStatus.GIVEN,
        title: 'GIVEN',
        vaccine: route.params.vaccine,
        color: theme.colors.SAFE,
        icon: Icons.GivenOnTimeIcon,
      },
      {
        key: VaccineStatus.NOT_GIVEN,
        title: 'NOT\nGIVEN ',
        vaccine: route.params.vaccine,
        color: theme.colors.PRIMARY_MAIN,
        icon: Icons.NotGivenIcon,
      },
    ],
    [route],
  );

  const [state, setState] = useState({
    index: 0,
    routes,
  });

  useEffect(() => {
    switch (route.params.vaccine.status) {
      case VaccineStatus.NOT_GIVEN:
        setState({
          index: 1,
          routes,
        });
        break;
      default:
    }
  }, [route]);

  return (
    <FullView>
      <Header navigation={navigation} vaccine={route.params.vaccine} />
      <VaccineTabNavigator
        state={state}
        scenes={{
          [VaccineStatus.GIVEN]: NewVaccineTab,
          [VaccineStatus.NOT_GIVEN]: NewVaccineTab,
        }}
        onChangeTab={setState}
      />
    </FullView>
  );
};
