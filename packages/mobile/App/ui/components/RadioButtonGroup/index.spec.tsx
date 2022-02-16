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
      },
    ],
  };
  it('should render <RadioButtonGroup/>', () => {
    const { getByText } = render(<RadioButtonGroup {...props} />);
    props.options.forEach(option => {
      expect(getByText(option.label)).not.toBe(null);
    });
  });

  it('should call onChange when pressed a <RadioButton/>', () => {
    const { getByText } = render(<RadioButtonGroup {...props} />);
    fireEvent.press(getByText(props.options[0].label));
    expect(props.onChange).toHaveBeenCalled();
  });
});
