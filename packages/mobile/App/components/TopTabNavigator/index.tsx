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
import { theme } from '../../styled/theme';

// Props accepted by the view
type TabNavigationConfig = {
  tabBarStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

// Supported screen options
type TabNavigationOptions = {
  title?: string;
};

// Map of events and the type of data (in event.data)
type TabNavigationEventMap = {
  tabPress: { isAlreadyFocused: boolean };
};

// The props accepted by the component is a combination of 3 things
type Props = DefaultNavigatorOptions<TabNavigationOptions> &
  TabRouterOptions &
  TabNavigationConfig;

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
      }}
      state={state}
      navigation={navigation}
      descriptors={descriptors}
    />
  );
}

export const createTopTabNavigator = createNavigatorFactory(TabNavigator);
