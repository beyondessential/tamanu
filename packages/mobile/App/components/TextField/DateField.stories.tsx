import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { KeyboardAwareView } from '../KeyboardAwareView';
import { CenterView } from '../../styled/common';
import { BaseDateTextFieldStory } from './fixtures';
import { DateFormats } from '../../helpers/constants';

const stories = storiesOf('DateTextField', module);

stories.addDecorator((getStory: Function) => (
  <KeyboardAwareView>
    <CenterView>{getStory()}</CenterView>
  </KeyboardAwareView>
));

stories.add('Active short Date', () => (
  <BaseDateTextFieldStory
    dateFormat={DateFormats.short}
    label="First Year of Registration"
  />
));
stories.add('DD/MM/YY Date', () => (
  <BaseDateTextFieldStory dateFormat={DateFormats['DD/MM/YY']} label="Date" />
));

stories.add('DAY_MONTH_YEAR_SHORT', () => (
  <BaseDateTextFieldStory
    label="Date"
    dateFormat={DateFormats.DAY_MONTH_YEAR_SHORT}
  />
));

stories.add('With Error', () => (
  <BaseDateTextFieldStory
    label="Date"
    dateFormat={DateFormats.DAY_MONTH_YEAR_SHORT}
    error={' with error '}
  />
));
