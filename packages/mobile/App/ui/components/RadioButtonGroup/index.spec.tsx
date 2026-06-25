import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RadioButtonGroup, RadioButtonGroupProps } from './index';

describe('<RadioButtonGroup />', () => {
  const props: RadioButtonGroupProps = {
    onChange: jest.fn(),
    options: [
      {
        label: '1',
        value: 'Female',
        selected: false,
      },
      {
        label: '2',
        value: 'Male',
      },
    ],
  };
  it('should render <RadioButtonGroup/>', async () => {
    const { getByText } = await render(<RadioButtonGroup {...props} />);
    props.options.forEach(option => {
      expect(getByText(option.label)).not.toBe(null);
    });
  });

  it('should call onChange when pressed a <RadioButton/>', async () => {
    const { getByText } = await render(<RadioButtonGroup {...props} />);
    await fireEvent.press(getByText(props.options[0].label));
    expect(props.onChange).toHaveBeenCalled();
  });
});
