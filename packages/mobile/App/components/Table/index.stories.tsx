import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ScrollView } from 'react-native';
import { CenterView } from '../CenterView';
import {
  patientHistoryList,
  vitalsTableHeader,
  vitalsTableCols,
} from './fixtures';
import { StyledSafeAreaView } from '../../styled/common';
import { Table } from '.';

storiesOf('Table', module)
  .addDecorator((getStory: Function) => <CenterView>{getStory()}</CenterView>)
  .add('Vitals Table', () => (
    <StyledSafeAreaView width="100%" height="100%" marginTop={40}>
      <ScrollView>
        <Table
          columns={vitalsTableCols}
          title="Measures"
          data={patientHistoryList}
          tableHeader={vitalsTableHeader}
        />
      </ScrollView>
    </StyledSafeAreaView>
  ));
