import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  createNavigatorFactory,
  DefaultNavigatorOptions,
  TabNavigationState,
  TabRouter,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { MaterialTopTabView } from '@react-navigation/material-top-tabs';
import { theme } from '/styled/theme';

type TabNavigationConfig = {
  tabBarStyle: StyleProp<ViewStyle>;
  contentStyle: StyleProp<ViewStyle>;
  swipeEnabled: boolean;
  lazy: boolean;
};

type TabNavigationOptions = {
  title?: string;
  tabBarLabelStyle?: object;
};

type TabNavigationEventMap = {
  tabPress: { isAlreadyFocused: boolean };
};

type Props = DefaultNavigatorOptions<any, any, TabNavigationOptions, any, any> &
  TabRouterOptions &
  TabNavigationConfig;

function TabNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}: Props): React.ReactElement {
  const { state, navigation, descriptors } = useNavigationBuilder<
    TabNavigationState<any>,
    TabRouterOptions,
    {},
    TabNavigationOptions,
    TabNavigationEventMap
  >(TabRouter, {
    children,
    screenOptions: {
      tabBarStyle: { height: 50 },
      tabBarActiveTintColor: theme.colors.PRIMARY_MAIN,
      tabBarInactiveTintColor: theme.colors.TEXT_MID,
      tabBarIndicatorStyle: {
        height: 4,
        backgroundColor: theme.colors.PRIMARY_MAIN,
      },
      tabBarLabelStyle: {
        fontWeight: '500',
        textTransform: 'none',
      },
      ...(typeof screenOptions === 'object' ? screenOptions : {}),
    },
    initialRouteName,
  });

  return (
    <MaterialTopTabView
      {...rest}
      state={state}
      navigation={navigation}
      descriptors={descriptors}
    />
  );
}

export const createTopTabNavigator = createNavigatorFactory(TabNavigator);
