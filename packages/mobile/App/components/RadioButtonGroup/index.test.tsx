import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RadioButtonGroupProps, RadioButtonGroup } from './index';

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
        selected: false,
      },
    ],
  };
  const { getByText } = render(<RadioButtonGroup {...props} />);
  it('should render <RadioButtonGroup/>', () => {
    props.options.forEach(option => {
      expect(getByText(option.value)).not.toBe(null);
    });
  });

  it('should call onChange when pressed a <RadioButton/>', () => {
    fireEvent.press(getByText(props.options[0].value));
    expect(props.onChange).toHaveBeenCalled();
  });
});
