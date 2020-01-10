import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationTabProp } from 'react-navigation-tabs';
import { NavigationRoute } from 'react-navigation';
import { IntroRouteProps } from './Intro';
import {
  RowView,
  StyledView,
  StyledSafeAreaView,
  CenterView,
} from '../../styled/common';
import { Button } from '../Button';
import { theme } from '../../styled/theme';

interface AppIntroNavigationState {
  navigation: NavigationTabProp<{
    key: string;
    index: number;
    routeName: string;
    path?: string;
    params: IntroRouteProps;
    routes: NavigationRoute<IntroRouteProps>[];
    isTransitioning: boolean;
  }>;
}

interface AppIntroProps extends AppIntroNavigationState {
  renderIcon: any;
  activeTintColor: string;
  inactiveTintColor: string;
  onTabPress: Function;
  onTabLongPress: Function;
  getAccessibilityLabel: Function;
}

export const AppIntroTab = (props: AppIntroProps): JSX.Element => {
  const {
    activeTintColor,
    inactiveTintColor,
    onTabPress,
    getAccessibilityLabel,
    navigation,
  } = props;

  const { routes, index: activeRouteIndex } = navigation.state;

  const navigateToNextScreen = React.useCallback(() => {
    if (activeRouteIndex < routes.length - 1) {
      onTabPress({ route: routes[activeRouteIndex + 1] });
    } else if (routes[activeRouteIndex].params) {
      navigation.navigate(routes[activeRouteIndex].params!.routeOutside);
    }
  }, [activeRouteIndex, navigation, onTabPress, routes]);

  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN} height={200}>
      <RowView alignItems="center" justifyContent="center">
        <RowView width={60} justifyContent="space-around">
          {routes.map((route: NavigationRoute, routeIndex: number) => {
            const isRouteActive = routeIndex === activeRouteIndex;
            const tintColor = isRouteActive
              ? activeTintColor
              : inactiveTintColor;
            return (
              <TouchableOpacity
                key={route.routeName}
                onPress={(): void => {
                  onTabPress({ route });
                }}
                accessibilityLabel={getAccessibilityLabel({ route })}
              >
                <StyledView
                  borderRadius={50}
                  height={10}
                  width={10}
                  background={tintColor}
                />
              </TouchableOpacity>
            );
          })}
        </RowView>
      </RowView>
      <CenterView>
        <Button
          onPress={navigateToNextScreen}
          width={180}
          borderColor={theme.colors.WHITE}
          outline
          buttonText="Skip"
          backgroundColor={theme.colors.PRIMARY_MAIN}
          textColor={theme.colors.WHITE}
        />
      </CenterView>
    </StyledSafeAreaView>
  );
};
