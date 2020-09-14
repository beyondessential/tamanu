import React, { useState } from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '/styled/common';
import { RadioButtonGroup } from './index';

function RadioButtonGroupStory({
  error: defaultError,
}: {
  error: boolean;
}): JSX.Element {
  const [error, setError] = useState(defaultError);
  const [options] = useState([
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

  const onSelectOption = (value: string): void => {
    setSelectedOption(value);
    setError(false);
  };

  const props = {
    options,
    onChange: onSelectOption,
    error,
  };

  return <RadioButtonGroup value={selectedOption} {...props} />;
}

storiesOf('Radio Button Group', module)
  .addDecorator((getStory: Function) => <CenterView>{getStory()}</CenterView>)
  .add('Basic', () => <RadioButtonGroupStory error={false} />)
  .add('With error', () => <RadioButtonGroupStory error />);
