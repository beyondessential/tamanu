import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseNumberFieldStory } from './fixtures';

describe('<NumberField />', (): void => {
  const props = {
    label: 'Weight in kg',
  };
  const newValue = '123';

  it('should render label', async (): Promise<void> => {
    const { getByText } = await render(<BaseNumberFieldStory label={props.label} />);
    expect(getByText(props.label)).not.toBe(null);
  });
  it('should change values', async (): Promise<void> => {
    const { getByLabelText } = await render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    await fireEvent.changeText(input, newValue);
    expect(input.props['value']).toBe(newValue);
  });
  it('should be nullable', async (): Promise<void> => {
    const { getByLabelText } = await render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    await fireEvent.changeText(input, undefined);
    expect(input.props['value']).toBe('');
  });
  it('should nullify alpha characters', async (): Promise<void> => {
    const { getByLabelText } = await render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    await fireEvent.changeText(input, 'invalid value');
    expect(input.props['value']).toBe('');
  });
});
