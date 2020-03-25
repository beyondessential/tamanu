import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PatientMenuButton } from './index';
import { Deceased } from '../Icons';

describe('<PatientMenuButton />', () => {
  const props = {
    title: 'test',
    onPress: jest.fn(),
    Icon: Deceased,
  };

  const { getByText } = render(<PatientMenuButton {...props} />);
  const buttonTitle = getByText(props.title);
  it('should render PatientMenuButton', () => {
    expect(buttonTitle).not.toBeNull();
  });

  it('should trigger onPress when pressed', () => {
    fireEvent.press(buttonTitle);
    expect(props.onPress).toHaveBeenCalled();
  });
});
