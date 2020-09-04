import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ScrollView } from 'react-native';
import { StyledSafeAreaView, CenterView } from '/styled/common';
import { VitalsTable } from './index';
import { patientHistoryList } from './fixtures';

storiesOf('Vitals Table', module)
  .addDecorator((Story: Function) => (
    <CenterView flex={1}>
      <Story />
    </CenterView>
  ))
  .add('example', () => (
    <StyledSafeAreaView width="100%" height="100%" marginTop={40}>
      <ScrollView>
        <VitalsTable patientData={patientHistoryList} />
      </ScrollView>
    </StyledSafeAreaView>
  ));
