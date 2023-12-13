import { BarChartIcon, HomeBottomLogoIcon, MoreMenuIcon, SyncDataIcon } from '/components/Icons';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { MoreScreen, ReportScreen, SyncDataScreen } from '/navigation/screens/home/Tabs';
import { HomeScreen } from '/navigation/screens/home/Tabs/HomeScreen';
import { PatientHome } from '/navigation/screens/home/Tabs/PatientHome';
import {
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';
import {
  BottomTabBarProps,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React, { FC, ReactElement } from 'react';
import { SvgProps } from 'react-native-svg';
import { compose } from 'redux';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

const Tabs = createBottomTabNavigator();

interface TabIconProps {
  Icon: FC<IconWithSizeProps>;
  color: string;
}

export function TabIcon({ Icon, color }: TabIconProps): JSX.Element {
  return (
    <StyledView>
      <Icon
        fill={color}
        size={screenPercentageToDP(3.03, Orientation.Height)}
      />
    </StyledView>
  );
}

const TabScreenIcon = (Icon: FC<SvgProps>) =>
(props: {
  focused: boolean;
  color: string;
}): ReactElement => <TabIcon Icon={Icon} {...props} />;

const HomeScreenOptions: BottomTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(HomeBottomLogoIcon),
  tabBarLabel: 'Home',
  tabBarTestID: 'HOME',
};
const ReportScreenOptions: BottomTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(BarChartIcon),
  tabBarLabel: 'Reports',
  tabBarTestID: 'REPORTS',
};
const SyncDataScreenOptions: BottomTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(SyncDataIcon),
  tabBarLabel: 'Sync Data',
  tabBarTestID: 'Sync Data',
};
const MoreScreenOptions: BottomTabNavigationOptions = {
  tabBarIcon: TabScreenIcon(MoreMenuIcon),
  tabBarLabel: 'More',
  tabBarTestID: 'MORE',
};

const tabLabelFontSize = screenPercentageToDP(1.21, Orientation.Height);

function MyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): ReactElement {
  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView
        height={screenPercentageToDP(6.5, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
        justifyContent="center"
        alignItems="center"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          let label = '';
          const { tabBarIcon: Icon } = options;

          if (options.title) label = options.title;
          if (route.name) label = route.name;
          if (options.tabBarLabel) label = options.tabBarLabel.toString();

          const isFocused = state.index === index;

          const onPress = (): void => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = (): void => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <StyledView key={route.key} flex={1}>
              <StyledTouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                alignItems="center"
                justifyContent="center"
                flex={1}
              >
                {Icon
                  && Icon({
                    focused: isFocused,
                    color: isFocused
                      ? theme.colors.SECONDARY_MAIN
                      : theme.colors.WHITE,
                    size: screenPercentageToDP(3.03, Orientation.Height),
                  })}
                <StyledText
                  color={isFocused ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
                  marginTop={3}
                  fontSize={tabLabelFontSize}
                >
                  {label}
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          );
        })}
      </RowView>
    </StyledSafeAreaView>
  );
}

const TabNavigator = ({ selectedPatient }: BaseAppProps): ReactElement => (
  <ErrorBoundary>
    <Tabs.Navigator tabBar={MyTabBar}>
      <Tabs.Screen
        options={HomeScreenOptions}
        name={Routes.HomeStack.HomeTabs.Home}
        component={selectedPatient ? PatientHome : HomeScreen}
      />
      <Tabs.Screen
        options={ReportScreenOptions}
        name={Routes.HomeStack.HomeTabs.Reports}
        component={ReportScreen}
      />
      <Tabs.Screen
        options={SyncDataScreenOptions}
        name={Routes.HomeStack.HomeTabs.SyncData}
        component={SyncDataScreen}
      />
      <Tabs.Screen
        options={MoreScreenOptions}
        name={Routes.HomeStack.HomeTabs.More}
        component={MoreScreen}
      />
    </Tabs.Navigator>
  </ErrorBoundary>
);

export const HomeTabsStack = compose(withPatient)(TabNavigator);
