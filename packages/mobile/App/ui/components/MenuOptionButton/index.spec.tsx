import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { MoreMenuOptions } from './fixture';
import { MenuOptionButton } from './index';

describe('<MenuOptionButton />', () => {
  const optionProps = {
    ...MoreMenuOptions[0],
    onPress: jest.fn(),
  };
  it('should render MenuOption correctly', () => {
    const { getByText } = render(<MenuOptionButton {...optionProps} />);
    const title = getByText(optionProps.title);
    expect(title).not.toBeNull();
  });

  it('should trigger onPress when pressed', () => {
    const { getByText } = render(<MenuOptionButton {...optionProps} />);
    const title = getByText(optionProps.title);
    fireEvent.press(title);
    expect(optionProps.onPress).toHaveBeenCalled();
  });
});
