import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PatientMenuButton } from './index';
import { DeceasedIcon } from '../Icons';

describe('<PatientMenuButton />', () => {
  const props = {
    key: 'test',
    title: 'test',
    onPress: jest.fn(),
    Icon: DeceasedIcon,
  };

  it('should render PatientMenuButton', async () => {
    const { getByText } = await render(<PatientMenuButton {...props} />);
    const buttonTitle = getByText(props.title);
    expect(buttonTitle).not.toBeNull();
  });

  it('should trigger onPress when pressed', async () => {
    const { getByText } = await render(<PatientMenuButton {...props} />);
    const buttonTitle = getByText(props.title);
    await fireEvent.press(buttonTitle);
    expect(props.onPress).toHaveBeenCalled();
  });
});
