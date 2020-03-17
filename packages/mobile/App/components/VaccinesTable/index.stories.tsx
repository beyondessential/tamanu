import React from 'react';
import { ScrollView } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import { CenterView, StyledSafeAreaView } from '../../styled/common';
import { VaccinesTable } from '.';
import { vaccineHistoryList } from './fixture';
import { PatientModel } from '../../models/Patient';

storiesOf('VaccineTable', module)
  .addDecorator((getStory: Function) => <CenterView>{getStory()}</CenterView>)
  .add('Example', () => (
    <StyledSafeAreaView width="100%" height="100%" marginTop={40}>
      <ScrollView>
        <VaccinesTable
          onPressItem={(item: PatientModel): void => console.log(item)}
          data={vaccineHistoryList}
        />
      </ScrollView>
    </StyledSafeAreaView>
  ));
