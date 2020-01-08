import React from 'react';
import { Text } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { CenterView } from '../../styled/common';
import * as Icons from '../Icons';
import { BottomNavigator, TabIcon } from './index';

export const Home = React.memo(() => (
  <CenterView>
    <Text>Home</Text>
  </CenterView>
));

export const Reports = React.memo(() => (
  <CenterView>
    <Text>Reports</Text>
  </CenterView>
));

export const SyncData = React.memo(() => (
  <CenterView>
    <Text>Sync Data</Text>
  </CenterView>
));

export const More = React.memo(() => (
  <CenterView>
    <Text>More</Text>
  </CenterView>
));

const navigator = createBottomTabNavigator(
  {
    Home,
    Reports,
    SyncData,
    More,
  },
  {
    defaultNavigationOptions: ({ navigation }) => {
      const { routeName } = navigation.state;
      return {
        tabBarIcon: (props): JSX.Element | null => {
          switch (routeName) {
            case 'Home':
              return <TabIcon Icon={Icons.BottomNavLogo} {...props} />;
            case 'Reports':
              return <TabIcon Icon={Icons.BarChart} {...props} />;
            case 'SyncData':
              return <TabIcon Icon={Icons.SyncFiles} {...props} />;
            case 'More':
              return <TabIcon Icon={Icons.More} {...props} />;
            default:
              return null;
          }
        },
      };
    },
    tabBarComponent: BottomNavigator,
  },
);
export const App = createAppContainer(navigator);
