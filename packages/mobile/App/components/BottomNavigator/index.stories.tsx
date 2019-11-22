import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import BottomNavigator, { TabIcon } from './index';
import { Home, Reports, SyncData, More } from './fixtures';
import Icons from '../Icons';

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

const App = createAppContainer(navigator);
storiesOf('BottomNavigator', module).add('Common', () => <App />);
