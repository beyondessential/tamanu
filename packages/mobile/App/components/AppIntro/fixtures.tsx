import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { AppIntroComponent } from '.';
import { Intro } from './Intro';
import { AppIntro1, AppIntro2, AppIntro3 } from '../Icons';
import { StyledText, CenterView } from '../../styled/common';

export const WelcomeIntro = AppIntroComponent({
  Visits: {
    screen: Intro,
    params: {
      Icon: AppIntro1,
      user: {
        name: 'John',
      },
      title: 'Search for patients',
      message:
        'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
    },
  },
  Vitals: {
    screen: Intro,
    params: {
      Icon: AppIntro2,
      user: {
        name: 'John',
      },
      title: 'Record patient visits',
      message:
        'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
    },
  },
  Vaccines: {
    screen: Intro,
    params: {
      Icon: AppIntro3,
      user: {
        name: 'John',
      },
      title: 'Sync data to the central system',
      message:
        'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
      routeOutside: 'AfterTabs',
    },
  },
});

const AfterTabs = () => (
  <CenterView>
    <StyledText>After Intro!</StyledText>
  </CenterView>
);

const AppIntroStack = createStackNavigator(
  {
    WelcomeIntro,
    AfterTabs,
  },
  {
    headerMode: 'none',
  },
);

export const App = createAppContainer(AppIntroStack);
