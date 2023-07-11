import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  useNavigationBuilder,
  DefaultNavigatorOptions,
  TabRouter,
  TabRouterOptions,
  createNavigatorFactory,
  TabNavigationState,
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
};

type TabNavigationEventMap = {
  tabPress: { isAlreadyFocused: boolean };
};

type Props = DefaultNavigatorOptions<TabNavigationOptions> & TabRouterOptions & TabNavigationConfig;

function TabNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}: Props): React.ReactElement {
  const { state, navigation, descriptors } = useNavigationBuilder<
    TabNavigationState,
    TabRouterOptions,
    TabNavigationOptions,
    TabNavigationEventMap
  >(TabRouter, {
    children,
    screenOptions,
    initialRouteName,
  });

  return (
    <MaterialTopTabView
      {...rest}
      tabBarOptions={{
        style: {
          height: 50,
        },
        activeTintColor: theme.colors.PRIMARY_MAIN,
        inactiveTintColor: theme.colors.TEXT_MID,
        indicatorStyle: {
          height: 4,
          backgroundColor: theme.colors.PRIMARY_MAIN,
        },
        labelStyle: {
          fontWeight: '500',
          textTransform: 'none',
        },
      }}
      state={state}
      navigation={navigation}
      descriptors={descriptors}
    />
  );
}

export const createTopTabNavigator = createNavigatorFactory(TabNavigator);
