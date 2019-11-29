import {
  createMaterialTopTabNavigator,
  NavigationMaterialTabOptions,
  NavigationTabProp,
} from 'react-navigation-tabs';
import theme from '../../styled/theme';
import {
  NavigationRouteConfigMap,
  NavigationRoute,
  NavigationParams,
} from 'react-navigation';

type TopTabNavigator = NavigationRouteConfigMap<
  NavigationMaterialTabOptions,
  NavigationTabProp<NavigationRoute<NavigationParams>, any>
>;

export const TopTabNavigator = (routes: TopTabNavigator) => {
  return createMaterialTopTabNavigator(routes, {
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
};

export default TopTabNavigator;
