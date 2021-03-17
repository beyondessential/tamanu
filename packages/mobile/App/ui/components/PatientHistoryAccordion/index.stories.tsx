import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '/styled/common';
import { PatientHistoryAccordion } from './index';
import { data } from './fixtures';

storiesOf('PatientHistoryAccordion', module)
  .addDecorator((getStory: any) => (
    <CenterView flex={1}>{getStory()}</CenterView>
  ))
  .add('List', () => <PatientHistoryAccordion dataArray={data} />);
