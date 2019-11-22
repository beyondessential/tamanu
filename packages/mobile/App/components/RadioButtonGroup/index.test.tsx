import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RadioButtonGroup, { RadioButtonGroupProps } from './index';

describe('<RadioButtonGroup />', () => {
  const props: RadioButtonGroupProps = {
    onSelectOption: jest.fn(),
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
    for (const option of props.options) {
      expect(getByText(option.value)).not.toBe(null);
    }
  });

  it('should call onSelectOption when pressed a <RadioButton/>', () => {
    fireEvent.press(getByText(props.options[0].value));
    expect(props.onSelectOption).toHaveBeenCalled();
  });
});
