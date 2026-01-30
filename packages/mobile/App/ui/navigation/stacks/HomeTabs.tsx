import React, { FC, ReactElement } from 'react';
import { compose } from 'redux';
import {
  BottomTabBarProps,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { PatientHome } from '/navigation/screens/home/Tabs/PatientHome';
import {
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { HomeScreen } from '/navigation/screens/home/Tabs/HomeScreen';
import { withPatient } from '/containers/Patient';
import { SvgProps } from 'react-native-svg';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { Routes } from '/helpers/routes';
import { MoreScreen, ReportScreen, SyncDataScreen } from '/navigation/screens/home/Tabs';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { SearchPatientStack } from './SearchPatient';
import { HomeLogoIcon } from '~/ui/components/Icons/HomeLogo';
import { ReportsIcon } from '~/ui/components/Icons/Reports';
import { PatientIcon } from '~/ui/components/Icons/Patient';
import { SyncCloudIcon } from '~/ui/components/Icons/SyncCloud';
import { MoreLogoIcon } from '~/ui/components/Icons/MoreLogo';
import { useTranslation } from '/contexts/TranslationContext';

const Tabs = createBottomTabNavigator();

interface TabIconProps {
  Icon: FC<IconWithSizeProps>;
  focusedColor: string;
  strokeColor: string;
  color: string;
}

export function TabIcon({ Icon, color, focusedColor, strokeColor }: TabIconProps): JSX.Element {
  return (
    <StyledView>
      <Icon fill={color} focusedColor={focusedColor} strokeColor={strokeColor} />
    </StyledView>
  );
}

const TabScreenIcon = (Icon: FC<SvgProps>) => (props: {
  focused: boolean;
  focusedColor: string;
  strokeColor: string;
  color: string;
}): ReactElement => <TabIcon Icon={Icon} {...props} />;

const tabLabelFontSize = screenPercentageToDP(1.47, Orientation.Height);

function getActiveRouteName(navigationState) {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  // Nested navigators
  if (route.state) {
    return getActiveRouteName(route.state);
  }
  return route;
}

function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps): ReactElement {
  const currentRoute = getActiveRouteName(state);
  const shouldHideTabBar = !!currentRoute?.params?.hideTabBar;

  if (shouldHideTabBar) return null;

  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView
        height={screenPercentageToDP(8, Orientation.Height)}
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
            <StyledView key={route.key} flex={1} paddingTop={13} paddingBottom={13}>
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
                {Icon &&
                  Icon({
                    focused: isFocused,
                    focusedColor: isFocused ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE,
                    strokeColor: isFocused ? theme.colors.PRIMARY_MAIN : theme.colors.WHITE,
                    color: isFocused ? theme.colors.SECONDARY_MAIN : 'none',
                  })}
                <StyledText color={theme.colors.WHITE} fontSize={tabLabelFontSize} fontWeight={500}>
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

const TabNavigator = ({ selectedPatient }: BaseAppProps): ReactElement => {
  const { getTranslation } = useTranslation();

  const HomeScreenOptions: BottomTabNavigationOptions = {
    tabBarIcon: TabScreenIcon(HomeLogoIcon),
    tabBarLabel: getTranslation('general.home', 'Home'),
    tabBarTestID: 'HOME',
    unmountOnBlur: true,
    headerShown: false,
  };
  const ReportScreenOptions: BottomTabNavigationOptions = {
    tabBarIcon: TabScreenIcon(ReportsIcon),
    tabBarLabel: getTranslation('general.reports', 'Reports'),
    tabBarTestID: 'REPORTS',
    headerShown: false,
  };
  const PatientScreenOptions: BottomTabNavigationOptions = {
    tabBarIcon: TabScreenIcon(PatientIcon),
    tabBarLabel: getTranslation('general.patient', 'Patient'),
    tabBarTestID: 'PATIENT',
    headerShown: false,
  };
  const SyncDataScreenOptions: BottomTabNavigationOptions = {
    tabBarIcon: TabScreenIcon(SyncCloudIcon),
    tabBarLabel: getTranslation('general.sync', 'Sync'),
    tabBarTestID: 'Sync Data',
    headerShown: false,
  };
  const MoreScreenOptions: BottomTabNavigationOptions = {
    tabBarIcon: TabScreenIcon(MoreLogoIcon),
    tabBarLabel: getTranslation('general.more', 'More'),
    tabBarTestID: 'MORE',
    headerShown: false,
  };

  return (
    <ErrorBoundary>
      <Tabs.Navigator tabBar={MyTabBar}>
        <Tabs.Screen
          options={HomeScreenOptions}
          name={Routes.HomeStack.HomeTabs.Home}
          component={HomeScreen}
        />
        <Tabs.Screen
          options={SyncDataScreenOptions}
          name={Routes.HomeStack.HomeTabs.SyncData}
          component={SyncDataScreen}
        />
        <Tabs.Screen
          options={PatientScreenOptions}
          name={Routes.HomeStack.SearchPatientStack.Index}
          component={selectedPatient ? PatientHome : SearchPatientStack}
        />
        <Tabs.Screen
          options={ReportScreenOptions}
          name={Routes.HomeStack.HomeTabs.Reports}
          component={ReportScreen}
        />
        <Tabs.Screen
          options={MoreScreenOptions}
          name={Routes.HomeStack.HomeTabs.More}
          component={MoreScreen}
        />
      </Tabs.Navigator>
    </ErrorBoundary>
  );
};

export const HomeTabsStack = compose(withPatient)(TabNavigator);
