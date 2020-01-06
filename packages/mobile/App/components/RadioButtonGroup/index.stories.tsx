import React, { useState } from 'react';
import { storiesOf } from '@storybook/react-native';
import { RadioButtonGroup } from './index';
import { CenterView } from '../../styled/common';

function RadioButtonGroupStory({ error: defaultError }: { error?: boolean }) {
  const [error, setError] = useState(defaultError);
  const [options, setOptions] = useState([
    {
      label: 'Female',
      value: 'female',
    },
    {
      label: 'Male',
      value: 'male',
    },
  ]);
  const [selectedOption, setSelectedOption] = useState('');

  const onSelectOption = (value: string) => {
    setSelectedOption(value);
    setError(false);
  };

  const props = {
    options,
    onSelectOption,
    error,
  };

  return <RadioButtonGroup selected={selectedOption} {...props} />;
}

storiesOf('Radio Button Group', module)
  .addDecorator((getStory: Function) => <CenterView>{getStory()}</CenterView>)
  .add('Basic', () => <RadioButtonGroupStory />)
  .add('With error', () => <RadioButtonGroupStory error />);
