import React, { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  useNavigationBuilder,
  createNavigatorFactory,
  TabRouter,
  TabRouterOptions,
  DefaultNavigatorOptions,
} from '@react-navigation/native';
import { MaterialTopTabView } from '@react-navigation/material-top-tabs';
import { TouchableOpacity } from 'react-native-gesture-handler';
/*eslint-disable import/no-unresolved */
import {
  MaterialTopTabNavigationConfig,
  MaterialTopTabBarOptions,
} from '@react-navigation/material-top-tabs/lib/typescript/src/types';
/*eslint-enable import/no-unresolved */
import { compose } from 'redux';
import {
  StyledSafeAreaView,
  RowView,
  StyledView,
  FullView,
} from '/styled/common';
import { ArrowLeftIcon } from '/components/Icons';
import { SearchInput } from '/components/SearchInput';
import { Field } from '/components/Forms/FormField';
// Helpers
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
import { withPatient } from '/containers/Patient';
import { WithPatientStoreProps } from '/store/ducks/patient';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type TabNavigationConfig = {
  tabBarStyle: StyleProp<ViewStyle>;
  contentStyle: StyleProp<ViewStyle>;
};

type TabNavigationOptions = {
  title?: string;
};

type Props = DefaultNavigatorOptions<TabNavigationOptions> &
  MaterialTopTabBarOptions &
  MaterialTopTabNavigationConfig &
  TabNavigationConfig &
  TabRouterOptions &
  WithPatientStoreProps;

function BottomTabNavigator({
  initialRouteName,
  backBehavior,
  children,
  setSelectedPatient,
  ...rest
}: Props): React.ReactElement {
  const { state, descriptors, navigation } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    backBehavior,
    children,
  });

  const onNavigateToHome = useCallback(() => {
    setSelectedPatient(null);
    navigation.navigate(Routes.HomeStack.HomeTabs.Home);
  }, []);

  return (
    <FullView>
      <FullView>
        <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
          <RowView
            height={90}
            paddingTop={20}
            alignItems="center"
            paddingBottom={20}
            paddingRight={20}
          >
            <TouchableOpacity onPress={onNavigateToHome}>
              <StyledView
                paddingLeft={20}
                paddingTop={20}
                paddingBottom={20}
                paddingRight={20}
              >
                <ArrowLeftIcon
                  height={screenPercentageToDP(2.43, Orientation.Height)}
                  width={screenPercentageToDP(2.43, Orientation.Height)}
                />
              </StyledView>
            </TouchableOpacity>
            <StyledView flex={1}>
              <Field
                component={SearchInput}
                name="search"
                placeholder="Search for patients"
              />
            </StyledView>
          </RowView>
        </StyledSafeAreaView>
        <MaterialTopTabView
          {...rest}
          state={state}
          navigation={navigation}
          descriptors={descriptors}
        />
      </FullView>
    </FullView>
  );
}

const Navigator = compose(withPatient)(BottomTabNavigator);

export const createSearchPatientNavigator = createNavigatorFactory(Navigator);
