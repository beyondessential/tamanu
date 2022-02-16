import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PatientMenuButton } from './index';
import { DeceasedIcon } from '../Icons';

describe('<PatientMenuButton />', () => {
  const props = {
    title: 'test',
    onPress: jest.fn(),
    Icon: DeceasedIcon,
  };

  const { getByText } = render(<PatientMenuButton {...props} />);
  const buttonTitle = getByText(props.title);
  it('should render PatientMenuButton', () => {
    const { getByText } = render(<PatientMenuButton {...props} />);
    const buttonTitle = getByText(props.title);
    expect(buttonTitle).not.toBeNull();
  });

  it('should trigger onPress when pressed', () => {
    const { getByText } = render(<PatientMenuButton {...props} />);
    const buttonTitle = getByText(props.title);
    fireEvent.press(buttonTitle);
    expect(props.onPress).toHaveBeenCalled();
  });
});
