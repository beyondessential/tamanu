import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseNumberFieldStory } from './fixtures';

describe.only('<NumberField />', (): void => {
  const props = {
    label: 'Weight in kg',
  };
  const newValue = '123';
  const { getByText, getByLabelText } = render(
    <BaseNumberFieldStory label={props.label} />,
  );
  it('should render label', (): void => {
    expect(getByText(props.label)).not.toBe(null);
  });
  it('should change values', (): void => {
    const input = getByLabelText(props.label);
    fireEvent.changeText(input, newValue);
    expect(input.getProp('value')).toBe(newValue);
  });
  it('should be nullable', (): void => {
    const input = getByLabelText(props.label);
    fireEvent.changeText(input, undefined);
    expect(input.getProp('value')).toBe('');
  });
  it('should nullify alpha characters', (): void => {
    const input = getByLabelText(props.label);
    fireEvent.changeText(input, 'invalid value');
    expect(input.getProp('value')).toBe('');
  });
});
