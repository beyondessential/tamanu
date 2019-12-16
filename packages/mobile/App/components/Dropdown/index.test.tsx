import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseStory, items } from './fixture';

describe('<Dropdown />', () => {
  const { getByText, getByTestId } = render(<BaseStory />);

  it('should render <Dropdown />', () => {
    const floatingLabel = getByText('Type');
    fireEvent.press(floatingLabel);

    for (const item of items) {
      expect(getByTestId(item.value)).not.toBeNull();
    }
  });

  it('should select an item', () => {
    const Picker = getByTestId('ios-picker');
    fireEvent.valueChange(Picker, items[0].value);
    expect(getByText(items[0].label)).not.toBeNull();
  });
});
