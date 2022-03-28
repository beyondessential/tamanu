import React from 'react';
import { ScrollView } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { CenterView, StyledSafeAreaView } from '/styled/common';
import { SafeAreaProvider } from 'react-native-safe-area-view';
import { VaccinesTable } from '.';
import { vaccineHistoryList } from './fixture';
import { IPatient } from '~/types';

storiesOf('VaccineTable', module)
  .addDecorator((Story: Function) => (
    <CenterView flex={1}>
      <Story />
    </CenterView>
  ))
  .add('Example', () => (
    <SafeAreaProvider>
      <StyledSafeAreaView width="100%" height="100%" marginTop={40}>
        <ScrollView>
          <VaccinesTable
            onPressItem={(item: IPatient): void => console.log(item)}
            data={vaccineHistoryList}
          />
        </ScrollView>
      </StyledSafeAreaView>
    </SafeAreaProvider>
  ));
