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
import theme from '../../styled/theme';

type TopTabNavigator = NavigationRouteConfigMap<
  NavigationMaterialTabOptions,
  NavigationTabProp<NavigationRoute<NavigationParams>, any>
>;

export const TopTabNavigator = (routes: TopTabNavigator) =>
  createMaterialTopTabNavigator(routes, {
    tabBarOptions: {
      activeTintColor: theme.colors.PRIMARY_MAIN,
      inactiveTintColor: theme.colors.TEXT_MID,
      style: {
        backgroundColor: theme.colors.WHITE,
      },
      indicatorStyle: {
        backgroundColor: theme.colors.PRIMARY_MAIN,
        height: 3,
      },
    },
  });

export default TopTabNavigator;
