import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RadioButton, RadioOptionProps } from '.';

describe('<RadioButton />', () => {
  const props: RadioOptionProps = {
    index: 0,
    label: 'test',
    selected: false,
    value: 'Gender',
    onPress: jest.fn(),
  };
  it('should render correctly <RadioButton />', async () => {
    const { getByText } = await render(<RadioButton {...props} />);
    expect(getByText(props.label)).not.toBe(null);
  });

  it('should call function onPress <RadioButton />', async () => {
    const { getByText } = await render(<RadioButton {...props} />);
    await fireEvent.press(getByText(props.label));
    expect(props.onPress).toHaveBeenCalled();
  });
});
