import {
  createMaterialTopTabNavigator,
  NavigationMaterialTabOptions,
  NavigationTabProp,
} from 'react-navigation-tabs';
import {
  NavigationRouteConfigMap,
  NavigationRoute,
  NavigationParams,
} from 'react-navigation';
import { AppIntroTab } from './AppIntroTab';
import { theme } from '../../styled/theme';

type AppIntroComponentProps = NavigationRouteConfigMap<
  NavigationMaterialTabOptions,
  NavigationTabProp<NavigationRoute<NavigationParams>, any>
>;

export const AppIntroComponent = (routes: AppIntroComponentProps) =>
  createMaterialTopTabNavigator(routes, {
  tabBarPosition: 'bottom',
  swipeEnabled: true,
  tabBarComponent: AppIntroTab,
  tabBarOptions: {
    activeTintColor: theme.colors.SECONDARY_MAIN,
    inactiveTintColor: theme.colors.WHITE,
  },
  backBehavior: 'none',
});
