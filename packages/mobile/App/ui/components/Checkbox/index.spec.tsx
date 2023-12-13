import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Checkbox } from './index';

describe('<Checkbox />', () => {
  const props = {
    text: 'Send Reminders for Vaccines',
    value: false,
    onChange: jest.fn(),
  };
  const { getByText } = render(<Checkbox {...props} />);

  it('should trigger onChange callback when pressed', () => {
    const text = getByText(props.text);
    fireEvent.press(text);
    expect(props.onChange).toHaveBeenCalled();
  });
});
