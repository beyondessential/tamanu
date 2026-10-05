import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { MenuOptionButton } from './index';
import { MoreMenuOptions } from './fixture';

describe('<MenuOptionButton />', () => {
  const optionProps = {
    key: 'settings',
    ...MoreMenuOptions[0],
    onPress: jest.fn(),
  };
  it('should render MenuOption correctly', async () => {
    const { getByText } = await render(<MenuOptionButton {...optionProps} />);
    const title = getByText(optionProps.title);
    expect(title).not.toBeNull();
  });

  it('should trigger onPress when pressed', async () => {
    const { getByText } = await render(<MenuOptionButton {...optionProps} />);
    const title = getByText(optionProps.title);
    await fireEvent.press(title);
    expect(optionProps.onPress).toHaveBeenCalled();
  });
});
