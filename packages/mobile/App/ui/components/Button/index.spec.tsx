import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './index';

describe('<Button />', () => {
  const props = {
    onPress: jest.fn(),
  };

  it('should Render <Button/> ', async () => {
    const { getByText } = await render(
      <Button {...props}>
        <Text>123456</Text>
      </Button>,
    );
    expect(getByText('123456')).not.toBe(null);
  });

  it('should trigger onPress ', async () => {
    const { getByText } = await render(
      <Button {...props}>
        <Text>123456</Text>
      </Button>,
    );
    await fireEvent.press(getByText('123456'));
    expect(props.onPress).toHaveBeenCalled();
  });
});
