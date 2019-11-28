import React, { ComponentType, ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  TabView,
  SceneMap,
  TabBar,
  SceneRendererProps,
  NavigationState,
  Route,
} from 'react-native-tab-view';
import theme from '../../styled/theme';
import { StyledText, StyledView } from '../../styled/common';
import styled from 'styled-components/native';

const styles = StyleSheet.create({
  initalLayout: {
    width: Dimensions.get('window').width,
  },
  indicatorStyle: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
});

interface CustomLabelProps {
  route: Route;
  focused: boolean;
}

const CustomLabel = ({ route, focused }: CustomLabelProps) => {
  return (
    <StyledText
      color={focused ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_MID}>
      {route.title}
    </StyledText>
  );
};

interface CustomBarProps extends SceneRendererProps {
  navigationState: NavigationState<{ key: string; title: string }>;
  renderLabel: Function;
  indicatorStyle: object;
}

const StyledCustomBar = styled(StyledView)<CustomBarProps>``;

const CustomBar = (
  props: SceneRendererProps & {
    navigationState: NavigationState<{ key: string; title: string }>;
  },
) => (
  <StyledCustomBar
    background={'white'}
    as={TabBar}
    {...props}
    renderLabel={CustomLabel}
    indicatorStyle={styles.indicatorStyle}
  />
);

interface TopTabNavigatorProps {
  tabKeys: {
    [key: string]: ComponentType<
      SceneRendererProps & { route: { key: string; title: string } }
    >;
  };
  state: NavigationState<{
    key: string;
    title: string;
  }>;
  setState: Function;
}

export const TopTabNavigator = ({
  tabKeys,
  state,
  setState,
}: TopTabNavigatorProps) => {
  return (
    <TabView
      navigationState={state}
      renderScene={SceneMap(tabKeys)}
      renderTabBar={CustomBar}
      onIndexChange={index => setState({ ...state, index })}
      initialLayout={styles.initalLayout}
    />
  );
};
