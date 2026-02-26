import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseTextFieldStory } from './fixtures';

describe('<TextField />', (): void => {
  describe('Non Masked', (): void => {
    const nonMaskedProps = {
      label: 'First Year of Registration',
    };
    const newValue = 'test';
    it('should render label', (): void => {
      const { getByText } = render(<BaseTextFieldStory {...nonMaskedProps} />);
      expect(getByText(nonMaskedProps.label)).not.toBe(null);
    });
    it('should change values', (): void => {
      const { getByLabelText } = render(
        <BaseTextFieldStory {...nonMaskedProps} />
      );
      const input = getByLabelText(nonMaskedProps.label);
      fireEvent.changeText(input, newValue);
      expect(input.props['value']).toBe(newValue);
    });
  });
});
