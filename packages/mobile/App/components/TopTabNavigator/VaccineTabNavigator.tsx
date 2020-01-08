import React, { ComponentType, FunctionComponent } from 'react';
import { Dimensions } from 'react-native';
import {
  TabView,
  SceneMap,
  TabBar,
  SceneRendererProps,
  NavigationState,
  Route,
} from 'react-native-tab-view';
import { SvgProps } from 'react-native-svg';
import { theme } from '../../styled/theme';
import { StyledView, StyledText } from '../../styled/common';
import * as Icons from '../Icons';

type CustomRoute = Route & {
  icon: FunctionComponent<SvgProps>;
  color?: string;
};

type State = NavigationState<CustomRoute>;

type TabBarProps = SceneRendererProps & { navigationState: State };

const TabLabel = React.memo(({ route, focused }: LabelProps) => {
  const Icon: FunctionComponent<SvgProps> = route.icon;
  return (
    <StyledView height={110} alignItems="center" paddingTop={25}>
      <StyledView>{focused ? <Icon /> : <Icons.EmptyCircle />}</StyledView>
      <StyledText
        marginTop={10}
        textAlign="center"
        fontSize={13}
        color={focused ? route.color : theme.colors.TEXT_SOFT}
      >
        {route.title}
      </StyledText>
    </StyledView>
  );
});

const VaccineTabLabel = (props: LabelProps): JSX.Element => (
  <TabLabel {...props} />
);

interface LabelProps {
  route: CustomRoute;
  focused: boolean;
}

const CustomTabBar = React.memo((props: TabBarProps) => {
  const {
    navigationState: { routes, index },
  } = props;
  return (
    <TabBar
      style={{ backgroundColor: 'white' }}
      activeColor={routes[index].color}
      renderLabel={VaccineTabLabel}
      inactiveColor={theme.colors.TEXT_SOFT}
      {...props}
      indicatorStyle={{
        backgroundColor: routes[index].color,
        height: 5,
      }}
    />
  );
});

const renderTabBar = (props: TabBarProps) => <CustomTabBar {...props} />;

interface VaccineTabNavigator {
  state: any;
  scenes: {
    [key: string]: ComponentType<SceneRendererProps & { route: CustomRoute }>;
  };
  onChangeTab: Function;
}

export const VaccineTabNavigator = React.memo(
  ({ state, scenes, onChangeTab }: VaccineTabNavigator) => (
    <TabView
      navigationState={state}
      renderScene={SceneMap(scenes)}
      renderTabBar={renderTabBar}
      onIndexChange={index => onChangeTab({ ...state, index })}
      initialLayout={{ width: Dimensions.get('window').width }}
    />
  ),
);
