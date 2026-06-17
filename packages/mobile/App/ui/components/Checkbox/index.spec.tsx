import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Checkbox } from './index';

describe('<Checkbox />', () => {
  const props = {
    text: 'Send Reminders for Vaccines',
    value: false,
    onChange: jest.fn(),
  };

  it('should trigger onChange callback when pressed', async () => {
    const { getByText } = await render(<Checkbox {...props} />);
    const text = getByText(props.text);
    await fireEvent.press(text);
    expect(props.onChange).toHaveBeenCalled();
  });
});
