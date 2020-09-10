import React, { ComponentType, FunctionComponent } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  TabView,
  SceneMap,
  TabBar,
  SceneRendererProps,
  NavigationState,
  Route,
} from 'react-native-tab-view';
import { SvgProps } from 'react-native-svg';
import { theme } from '/styled/theme';
import { StyledView, StyledText } from '/styled/common';
import * as Icons from '../Icons';
import { IconWithSizeProps } from '/interfaces/WithSizeProps';
import { VaccineDataProps } from '../VaccineCard';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type CustomRoute = Route & {
  icon: FunctionComponent<SvgProps>;
  color?: string;
  vaccine: VaccineDataProps;
};

type State = NavigationState<CustomRoute>;

type TabBarProps = SceneRendererProps & { navigationState: State };

const TabLabel = React.memo(
  ({ route, focused }: LabelProps): Element => {
    const Icon: FunctionComponent<IconWithSizeProps> = route.icon;
    return (
      <StyledView
        height={screenPercentageToDP(13.36, Orientation.Height)}
        alignItems="center"
        paddingTop={screenPercentageToDP(3.03, Orientation.Height)}
      >
        <StyledView>
          {focused ? (
            <Icon size={screenPercentageToDP(4.25, Orientation.Height)} />
          ) : (
            <Icons.ScheduledVaccine
              size={screenPercentageToDP(4.25, Orientation.Height)}
            />
          )}
        </StyledView>
        <StyledText
          marginTop={screenPercentageToDP(1.21, Orientation.Height)}
          textAlign="center"
          fontSize={screenPercentageToDP(1.57, Orientation.Height)}
          color={focused ? route.color : theme.colors.TEXT_SOFT}
        >
          {route.title}
        </StyledText>
      </StyledView>
    );
  },
);

const VaccineTabLabel = (props: LabelProps): Element => (
  <TabLabel {...props} />
);

interface LabelProps {
  route: CustomRoute;
  focused: boolean;
}

/* eslint-disable implicit-arrow-linebreak */

const customIndicatorStyle = (color?: string): { indicator: object } =>
  StyleSheet.create({
    indicator: {
      backgroundColor: color,
      height: 5,
    },
  });

const TabBarStyle = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.WHITE,
  },
});

const CustomTabBar = React.memo(
  (props: TabBarProps): Element => {
    const {
      navigationState: { routes, index },
    } = props;
    return (
      <TabBar
        style={TabBarStyle.tabBar}
        activeColor={routes[index].color}
        renderLabel={VaccineTabLabel}
        inactiveColor={theme.colors.TEXT_SOFT}
        {...props}
        indicatorStyle={customIndicatorStyle(routes[index].color).indicator}
      />
    );
  },
);

const renderTabBar = (props: TabBarProps): Element => (
  <CustomTabBar {...props} />
);

interface VaccineTabNavigator {
  state: any;
  scenes: {
    [key: string]: ComponentType<SceneRendererProps & { route: CustomRoute }>;
  };
  onChangeTab: Function;
}

const TabViewStyle = StyleSheet.create({
  initialLayout: {
    width: Dimensions.get('window').width,
  },
});

export const VaccineTabNavigator = React.memo(
  ({ state, scenes, onChangeTab }: VaccineTabNavigator): Element => (
    <TabView
      navigationState={state}
      renderScene={SceneMap(scenes)}
      renderTabBar={renderTabBar}
      onIndexChange={(index): void => onChangeTab({ ...state, index })}
      initialLayout={TabViewStyle.initialLayout}
    />
  ),
);
