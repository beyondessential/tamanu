import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseNumberFieldStory } from './fixtures';

describe('<NumberField />', (): void => {
  const props = {
    label: 'Weight in kg',
  };
  const newValue = '123';

  it('should render label', (): void => {
    const { getByText } = render(<BaseNumberFieldStory label={props.label} />);
    expect(getByText(props.label)).not.toBe(null);
  });
  it('should change values', (): void => {
    const { getByLabelText } = render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    fireEvent.changeText(input, newValue);
    expect(input.props['value']).toBe(newValue);
  });
  it('should be nullable', (): void => {
    const { getByLabelText } = render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    fireEvent.changeText(input, undefined);
    expect(input.props['value']).toBe('');
  });
  it('should nullify alpha characters', (): void => {
    const { getByLabelText } = render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    fireEvent.changeText(input, 'invalid value');
    expect(input.props['value']).toBe('');
  });
});
