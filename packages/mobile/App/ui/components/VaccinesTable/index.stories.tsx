import { CenterView, StyledSafeAreaView } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-view';
import { IPatient } from '~/types';
import { VaccinesTable } from '.';
import { vaccineHistoryList } from './fixture';

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
