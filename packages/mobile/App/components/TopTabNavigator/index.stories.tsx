import React, { FunctionComponent, useState } from 'react';
import { storiesOf } from '@storybook/react-native';
import { TopTabNavigator } from './index';
import {
  StyledSafeAreaView,
  StyledText,
  StyledView,
} from '../../styled/common';
import theme from '../../styled/theme';
import { FirstRoute, SecondRoute, ThirdRoute } from './fixtures';

function BaseStory() {
  const [state, setState] = useState({
    index: 0,
    routes: [
      { key: 'first', title: 'Visits' },
      { key: 'second', title: 'Vitals' },
      { key: 'third', title: 'Vaccines' },
    ],
  });

  const props = {
    state,
    setState,
    tabKeys: {
      first: FirstRoute,
      second: SecondRoute,
      third: ThirdRoute,
    },
  };

  return <TopTabNavigator {...props} />;
}

storiesOf('Top Tab', module)
  .addDecorator((getStory: Function) => (
    <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN}>
      <StyledView
        height={60}
        width={'100%'}
        background={theme.colors.PRIMARY_MAIN}>
        <StyledText></StyledText>
      </StyledView>
      {getStory()}
    </StyledSafeAreaView>
  ))
  .add('Common', () => <BaseStory />);
