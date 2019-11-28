import React from 'react';
import { Text } from 'react-native';
import { CenterView } from '../../styled/common';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { createAppContainer } from 'react-navigation';
import { TabIcon, BottomNavigator } from './index';
import Icons from '../Icons';

export const Home = React.memo(() => {
  return (
    <CenterView>
      <Text>Home</Text>
    </CenterView>
  );
});

export const Reports = React.memo(() => {
  return (
    <CenterView>
      <Text>Reports</Text>
    </CenterView>
  );
});

export const SyncData = React.memo(() => {
  return (
    <CenterView>
      <Text>Sync Data</Text>
    </CenterView>
  );
});

export const More = React.memo(() => {
  return (
    <CenterView>
      <Text>More</Text>
    </CenterView>
  );
});

const bottomNavigator = createBottomTabNavigator(
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
        tabBarIcon: props => {
          switch (routeName) {
            case 'Home':
              return <TabIcon Icon={Icons.BottomNavLogo} {...props} />;
            case 'Reports':
              return <TabIcon Icon={Icons.More} {...props} />;
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

export const BottomTabApp = createAppContainer(bottomNavigator);
