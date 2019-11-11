import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from 'react-native-testing-library';
import Button from './index';

describe('<Button />', () => {
  const props = {
    onPress: jest.fn(),
  };
  it('should Render <Button/> ', () => {
    const { debug, getByText } = render(
      <Button {...props}>
        <Text>123456</Text>
      </Button>,
    );
    expect(getByText('123456')).not.toBe(null);
    console.log(debug());
  });

  it('should trigger onPress ', () => {
    const { getByText } = render(
      <Button {...props}>
        <Text>123456</Text>
      </Button>,
    );
    fireEvent.press(getByText('123456'));
    expect(props.onPress).toHaveBeenCalled();
  });
});
