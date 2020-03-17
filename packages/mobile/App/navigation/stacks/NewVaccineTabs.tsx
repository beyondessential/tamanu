import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import * as Icons from '../../components/Icons';
import { theme } from '../../styled/theme';
import { NewVaccineTab } from '../screens/vaccine/newVaccineTabs/NewVaccineTab';
import { VaccineTabNavigator } from '../../components/TopTabNavigator/VaccineTabNavigator';
import { FullView, RowView, StyledView, StyledText, StyledTouchableOpacity } from '../../styled/common';
import { ArrowDown } from '../../components/Icons';
import { Routes, VaccineStatus } from '../../helpers/constants';
import { VaccineDataProps } from '../../components/VaccineCard';

type NewVaccineHeaderProps = {
  navigation: NavigationProp<any>;
  vaccine: VaccineDataProps
}

const Header = ({
  navigation,
  vaccine,
}: NewVaccineHeaderProps): ReactElement => {
  const onPress = useCallback(
    () => {
      navigation.navigate(Routes.HomeStack.VaccineStack.VaccineTabs.name);
    },
    [],
  );
  return (
    <SafeAreaView
      style={{
        height: 140,
        backgroundColor: theme.colors.PRIMARY_MAIN,
      }}
    >
      <RowView
        height={102}
        background={theme.colors.PRIMARY_MAIN}
        justifyContent="space-between"
      >
        <StyledView
          height="100%"
          justifyContent="center"
          paddingLeft={20}
        >
          <StyledText
            color={theme.colors.WHITE}
            fontSize={21}
            fontWeight="bold"
          >{vaccine.name}
          </StyledText>
          <StyledText
            color={theme.colors.SECONDARY_MAIN}
            fontSize={21}
          >{vaccine.subtitle}
          </StyledText>
        </StyledView>
        <StyledView
          position="absolute"
          width="100%"
          alignItems="center"
          top="10%"
        >
          <StyledTouchableOpacity
            onPress={onPress}
          >
            <ArrowDown size={15} fill={theme.colors.WHITE} stroke={3} />
          </StyledTouchableOpacity>
        </StyledView>
        <StyledView
          height="100%"
          justifyContent="center"
          paddingRight={20}
        >
          <StyledText
            color={theme.colors.WHITE}
          >{vaccine.dateType}
          </StyledText>
        </StyledView>
      </RowView>
    </SafeAreaView>
  );
};

type NewVaccineTabsRouteProps = RouteProp<{
  NewVaccineTabs: {
    vaccine: VaccineDataProps
  }
}, 'NewVaccineTabs'>

interface NewVaccineTabsProps {
  navigation: NavigationProp<any>
  route: NewVaccineTabsRouteProps
}


export const NewVaccineTabs = ({ navigation, route }:NewVaccineTabsProps): ReactElement => {
  const routes = useMemo(() => [
    {
      key: VaccineStatus.TAKEN,
      title: 'TAKEN\nON TIME',
      vaccine: route.params.vaccine,
      color: theme.colors.SAFE,
      icon: Icons.Checked,
    },
    {
      key: VaccineStatus.TAKEN_NOT_ON_TIME,
      title: 'TAKEN NOT \n ON SCHEDULE',
      vaccine: route.params.vaccine,
      color: theme.colors.ORANGE,
      icon: Icons.TakenNotOnTime,
    },
    {
      key: VaccineStatus.NOT_TAKEN,
      title: 'NOT\nTAKEN ',
      vaccine: route.params.vaccine,
      color: theme.colors.PRIMARY_MAIN,
      icon: Icons.NotTaken,
    },
  ], [route]);
  const [state, setState] = useState({
    index: 0,
    routes,
  });

  useEffect(() => {
    switch (route.params.vaccine.status) {
      case VaccineStatus.TAKEN_NOT_ON_TIME:
        setState({
          index: 1,
          routes,
        });
        break;
      case VaccineStatus.NOT_TAKEN:
        setState({
          index: 2,
          routes,
        });
        break;
      default:
    }
  }, [route]);

  return (
    <FullView>
      <Header
        navigation={navigation}
        vaccine={route.params.vaccine}
      />
      <VaccineTabNavigator
        state={state}
        scenes={{
          [VaccineStatus.TAKEN]: NewVaccineTab,
          [VaccineStatus.TAKEN_NOT_ON_TIME]: NewVaccineTab,
          [VaccineStatus.NOT_TAKEN]: NewVaccineTab,
        }}
        onChangeTab={setState}
      />
    </FullView>
  );
};
