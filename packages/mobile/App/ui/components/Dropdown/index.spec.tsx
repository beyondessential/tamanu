import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseStory, dropdownItems } from './fixture';
import { SelectOption } from '.';

describe.skip('<Dropdown />', () => {
  const { getByText, getByTestId } = render(<BaseStory />);

  it('should render <Dropdown />', () => {
    const floatingLabel = getByText('Type');
    fireEvent.press(floatingLabel);

    dropdownItems.forEach((item: SelectOption) => {
      expect(getByTestId(item.value)).not.toBeNull();
    });
  });

  it('should select an item', () => {
    const Picker = getByTestId('ios-picker');
    fireEvent.valueChange(Picker, dropdownItems[0].value);
    expect(getByText(dropdownItems[0].label)).not.toBeNull();
  });
});
