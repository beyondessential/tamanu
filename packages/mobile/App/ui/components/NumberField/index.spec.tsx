import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseNumberFieldStory } from './fixtures';
import { NumberField } from './index';

/** Mirrors a Formik parent: stores the parsed value from `onChange` and passes it back down. */
function ControlledNumberField({ label }: { label: string }): JSX.Element {
  const [value, setValue] = useState<string | number>('');
  return <NumberField label={label} value={value} onChange={setValue} />;
}

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
    expect(input.props.value).toBe(newValue);
  });
  it('should be nullable', async (): Promise<void> => {
    const { getByLabelText } = await render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    await fireEvent.changeText(input, undefined);
    expect(input.props.value).toBe('');
  });
  it('should nullify alpha characters', async (): Promise<void> => {
    const { getByLabelText } = await render(<BaseNumberFieldStory label={props.label} />);
    const input = getByLabelText(props.label);
    await fireEvent.changeText(input, 'invalid value');
    expect(input.props.value).toBe('');
  });
  it('should adopt a value changed by the parent', async (): Promise<void> => {
    const { getByLabelText, rerender } = await render(
      <BaseNumberFieldStory label={props.label} value="12" />,
    );
    const input = getByLabelText(props.label);
    expect(input.props.value).toBe('12');
    await fireEvent.changeText(input, newValue);
    expect(input.props.value).toBe(newValue);
    await rerender(<BaseNumberFieldStory label={props.label} value="" />);
    expect(input.props.value).toBe('');
  });
  it('should call onChange with the parsed number, or an empty string for invalid input', async (): Promise<void> => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <BaseNumberFieldStory label={props.label} onChange={onChange} />,
    );
    const input = getByLabelText(props.label);
    await fireEvent.changeText(input, '1.5');
    expect(onChange).toHaveBeenLastCalledWith(1.5);
    await fireEvent.changeText(input, 'invalid value');
    expect(onChange).toHaveBeenLastCalledWith('');
  });
  it.each([
    ['a trailing decimal point', ['1', '1.'], '1.'],
    ['a trailing decimal point after backspacing', ['1.5', '1.'], '1.'],
    ['a leading zero', ['0', '01'], '01'],
    ['a leading decimal point', ['.', '.5'], '.5'],
  ])(
    'should keep %s when the parent echoes the parsed number back',
    async (_description, keystrokes: string[], expected: string): Promise<void> => {
      const { getByLabelText } = await render(<ControlledNumberField label={props.label} />);
      const input = getByLabelText(props.label);
      for (const text of keystrokes) {
        await fireEvent.changeText(input, text);
      }
      expect(input.props.value).toBe(expected);
    },
  );
});
