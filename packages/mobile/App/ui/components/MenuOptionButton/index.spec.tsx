import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MenuOptionButton } from './index';
import { MoreMenuOptions } from './fixture';

describe('<MenuOptionButton />', () => {
  const optionProps = {
    ...MoreMenuOptions[0],
    onPress: jest.fn(),
  };
  const { getByText } = render(<MenuOptionButton {...optionProps} />);
  const title = getByText(optionProps.title);
  it('should render MenuOption correctly', () => {
    expect(title).not.toBeNull();
  });

  it('should trigger onPress when pressed', () => {
    fireEvent.press(title);
    expect(optionProps.onPress).toHaveBeenCalled();
  });
});
