import React, { type ComponentProps, type ReactElement } from 'react';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { theme } from '/styled/theme';

const MaterialTopTabs = createMaterialTopTabNavigator();

const defaultScreenOptions: MaterialTopTabNavigationOptions = {
  swipeEnabled: false,
  tabBarStyle: { height: 50 },
  tabBarActiveTintColor: theme.colors.PRIMARY_MAIN,
  tabBarInactiveTintColor: theme.colors.TEXT_MID,
  tabBarIndicatorStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  tabBarLabelStyle: {
    fontWeight: '500',
    textTransform: 'none',
  },
};

// React Navigation only makes `id` optional under `strictNullChecks`, which this package has
// turned off. None of our tab navigators are looked up by ID, so relax it here.
interface TopTabNavigatorProps extends Omit<
  ComponentProps<typeof MaterialTopTabs.Navigator>,
  'id'
> {
  id?: string;
}

type ScreenOptions = TopTabNavigatorProps['screenOptions'];

/** Screen-level `options` still take precedence over anything merged in here. */
const withDefaultScreenOptions = (screenOptions: ScreenOptions): ScreenOptions =>
  typeof screenOptions === 'function'
    ? props => ({ ...defaultScreenOptions, ...screenOptions(props) })
    : { ...defaultScreenOptions, ...screenOptions };

/** A material top tab navigator carrying Tamanu's default tab bar styling. */
export const TopTabNavigator = ({
  id,
  screenOptions,
  ...props
}: TopTabNavigatorProps): ReactElement => (
  <MaterialTopTabs.Navigator
    id={id}
    screenOptions={withDefaultScreenOptions(screenOptions)}
    {...props}
  />
);

export const TopTabScreen = MaterialTopTabs.Screen;
