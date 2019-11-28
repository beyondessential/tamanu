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
  const { getByText } = render(<RadioButton {...props} />);
  it('should render correctly <RadioButton />', () => {
    expect(getByText(props.value)).not.toBe(null);
  });

  it('should call function onPress <RadioButton />', () => {
    fireEvent.press(getByText(props.value));
    expect(props.onPress).toHaveBeenCalled();
  });
});
