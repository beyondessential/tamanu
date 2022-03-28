import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RadioButton, RadioOptionProps } from '.';

describe('<RadioButton />', () => {
  const props: RadioOptionProps = {
    index: 0,
    label: 'test',
    selected: false,
    value: 'Gender',
    onPress: jest.fn(),
  };
  it('should render correctly <RadioButton />', () => {
    const { getByText } = render(<RadioButton {...props} />);
    expect(getByText(props.label)).not.toBe(null);
  });

  it('should call function onPress <RadioButton />', () => {
    const { getByText } = render(<RadioButton {...props} />);
    fireEvent.press(getByText(props.label));
    expect(props.onPress).toHaveBeenCalled();
  });
});
