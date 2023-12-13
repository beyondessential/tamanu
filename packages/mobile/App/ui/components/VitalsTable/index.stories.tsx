import { CenterView, StyledSafeAreaView } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-view';
import { patientHistoryList } from './fixtures';
import { VitalsTable } from './index';

storiesOf('Vitals Table', module)
  .addDecorator((Story: Function) => (
    <CenterView flex={1}>
      <Story />
    </CenterView>
  ))
  .add('example', () => (
    <SafeAreaProvider>
      <StyledSafeAreaView width="100%" height="100%" marginTop={40}>
        <ScrollView>
          <VitalsTable patientData={patientHistoryList} />
        </ScrollView>
      </StyledSafeAreaView>
    </SafeAreaProvider>
  ));
