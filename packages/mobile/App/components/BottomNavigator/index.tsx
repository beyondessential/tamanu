import React, { FunctionComponent } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import {
  NavigationState,
  NavigationScreenProp,
  NavigationParams,
} from 'react-navigation';
import { SvgProps } from 'react-native-svg';
import { CenterView, RowView, StyledAreaView } from '../../styled/common';
import styled from 'styled-components/native';
import theme from '../../styled/theme';

interface TabLabelProps {
  focused?: boolean;
}

const StyledTabLabel = styled.Text<TabLabelProps>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ focused }) =>
    focused ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE};
`;

interface TabButtonProps {
  route: { routeName: string };
  focused: boolean;
  onPress: () => void;
  renderIcon: Function;
}

interface TabIconProps {
  Icon: FunctionComponent<SvgProps>;
  focused: boolean;
}

export function TabIcon({ Icon, focused }: TabIconProps) {
  return (
    <Icon
      fill={focused ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
      height={25}
    />
  );
}

function TabButton({ route, focused, onPress, renderIcon }: TabButtonProps) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <CenterView>
        {renderIcon({ route, focused })}

        <StyledTabLabel focused={focused}>
          {route.routeName.toUpperCase()}
        </StyledTabLabel>
      </CenterView>
    </TouchableWithoutFeedback>
  );
}

interface RouteProps {
  routeName: string;
}

interface BottomNavigatorProps {
  navigation: NavigationScreenProp<NavigationState, NavigationParams>;
  renderIcon: Function;
}

function BottomNavigator(props: BottomNavigatorProps) {
  const { navigation, renderIcon } = props;
  const { routes, index: activeRouteIndex } = navigation.state;
  const { navigate } = navigation;
  return (
    <StyledAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView
        background={theme.colors.PRIMARY_MAIN}
        height={70}
        justifyContent={'space-around'}
        alignItems={'center'}>
        {routes.map((route: RouteProps, index: number) => (
          <TabButton
            key={route.routeName}
            renderIcon={renderIcon}
            route={route}
            onPress={() => navigate(route.routeName)}
            focused={index === activeRouteIndex}
          />
        ))}
      </RowView>
    </StyledAreaView>
  );
}

export default BottomNavigator;
