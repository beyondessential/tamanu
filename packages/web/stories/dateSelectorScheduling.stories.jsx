import React from 'react';
import { DateSelector } from '../app/views/scheduling/DateSelector';

export default {
  argTypes: {},
  title: 'DateSelectorScheduling',
  component: DateSelector,
};

const Template = args => {
  return <DateSelector {...args} />;
};

export const Default = Template.bind({});
Default.args = {};
