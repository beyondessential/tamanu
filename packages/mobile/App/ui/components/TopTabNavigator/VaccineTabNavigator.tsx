import React, { type ComponentType, type FunctionComponent, type ReactElement } from 'react';
import { Dimensions } from 'react-native';
import type { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import { theme } from '/styled/theme';
import { StyledText, StyledView } from '/styled/common';
import * as Icons from '../Icons';
import type { IconWithSizeProps } from '/interfaces/WithSizeProps';
import type { VaccineDataProps } from '../VaccineCard';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { VaccineStatus } from '/helpers/patient';
import { Routes } from '/helpers/routes';
import { TopTabNavigator, TopTabScreen } from './index';

const tabIconSize = screenPercentageToDP(2.5, Orientation.Height);

type VaccineTabLabelProps = {
  title: string;
  color: string;
  icon: FunctionComponent<IconWithSizeProps>;
  focused: boolean;
};

const VaccineTabLabel = ({
  title,
  color,
  icon: Icon,
  focused,
}: VaccineTabLabelProps): ReactElement => (
  <StyledView
    height={screenPercentageToDP(7.36, Orientation.Height)}
    alignItems="center"
    paddingTop={screenPercentageToDP(1.03, Orientation.Height)}
  >
    <StyledView>
      {focused ? <Icon size={tabIconSize} /> : <Icons.ScheduledVaccine size={tabIconSize} />}
    </StyledView>
    <StyledText
      marginTop={screenPercentageToDP(1.21, Orientation.Height)}
      textAlign="center"
      fontSize={screenPercentageToDP(1.57, Orientation.Height)}
      color={focused ? color : theme.colors.TEXT_SOFT}
    >
      {title}
    </StyledText>
  </StyledView>
);

const getTabScreenOptions = (
  label: Omit<VaccineTabLabelProps, 'focused'>,
): MaterialTopTabNavigationOptions => ({
  tabBarActiveTintColor: label.color,
  tabBarIndicatorStyle: { backgroundColor: label.color },
  tabBarLabel: ({ focused }) => <VaccineTabLabel {...label} focused={focused} />,
});

const navigatorScreenOptions = {
  swipeEnabled: true,
  tabBarStyle: { backgroundColor: theme.colors.WHITE },
  tabBarInactiveTintColor: theme.colors.TEXT_SOFT,
} as const satisfies MaterialTopTabNavigationOptions;

const initialLayout = { width: Dimensions.get('window').width };

interface VaccineTabNavigatorProps {
  vaccine: VaccineDataProps;
  component: ComponentType<any>;
}

export const VaccineTabNavigator = ({
  vaccine,
  component,
}: VaccineTabNavigatorProps): ReactElement => (
  <TopTabNavigator
    initialRouteName={
      vaccine.status === VaccineStatus.NOT_GIVEN
        ? Routes.HomeStack.VaccineStack.NewVaccineTabs.NotTakeTab
        : Routes.HomeStack.VaccineStack.NewVaccineTabs.GivenOnTimeTab
    }
    initialLayout={initialLayout}
    screenOptions={navigatorScreenOptions}
  >
    <TopTabScreen
      name={Routes.HomeStack.VaccineStack.NewVaccineTabs.GivenOnTimeTab}
      component={component}
      initialParams={{ vaccine, status: VaccineStatus.GIVEN }}
      options={getTabScreenOptions({
        title: 'Given',
        color: theme.colors.SAFE,
        icon: Icons.GivenOnTimeIcon,
      })}
    />
    <TopTabScreen
      name={Routes.HomeStack.VaccineStack.NewVaccineTabs.NotTakeTab}
      component={component}
      initialParams={{ vaccine, status: VaccineStatus.NOT_GIVEN }}
      options={getTabScreenOptions({
        title: 'Not given',
        color: theme.colors.PRIMARY_MAIN,
        icon: Icons.NotGivenIcon,
      })}
    />
  </TopTabNavigator>
);
