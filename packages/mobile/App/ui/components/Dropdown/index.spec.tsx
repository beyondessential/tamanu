import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseStory, dropdownItems } from './fixture';
import { SelectOption } from '.';

describe.skip('<Dropdown />', () => {
  it('should render <Dropdown />', async () => {
    const { getByText, getByTestId } = await render(<BaseStory />);
    const floatingLabel = getByText('Type');
    await fireEvent.press(floatingLabel);

    dropdownItems.forEach((item: SelectOption) => {
      expect(getByTestId(item.value)).not.toBeNull();
    });
  });

  it('should select an item', async () => {
    const { getByText, getByTestId } = await render(<BaseStory />);
    const Picker = getByTestId('ios-picker');
    await fireEvent(Picker, 'onValueChange', dropdownItems[0].value);
    expect(getByText(dropdownItems[0].label)).not.toBeNull();
  });
});
