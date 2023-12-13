import { CenterView } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { data } from './fixtures';
import { PatientHistoryAccordion } from './index';

storiesOf('PatientHistoryAccordion', module)
  .addDecorator((getStory: any) => <CenterView flex={1}>{getStory()}</CenterView>)
  .add('List', () => <PatientHistoryAccordion dataArray={data} />);
