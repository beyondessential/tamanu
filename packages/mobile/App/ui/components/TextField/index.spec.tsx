import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BaseMaskedTextFieldStory, BaseTextFieldStory } from './fixtures';

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

  describe('Masked', (): void => {
    describe('Phone Mask', (): void => {
      const phoneMaskProps = {
        masked: true,
        options: {
          mask: '9999 9999 999',
        },
        label: 'Phone',
      };
      const newValue = '1234';
      it('should render phone Mask', (): void => {
        const { getByText } = render(
          <BaseMaskedTextFieldStory {...phoneMaskProps} maskType='custom' />
        );
        expect(getByText(phoneMaskProps.label)).not.toBe(null);
      });

      it('should change values', async (): Promise<void> => {
        const { getByLabelText } = render(
          <BaseMaskedTextFieldStory {...phoneMaskProps} maskType='custom' />
        );
        const input = getByLabelText(phoneMaskProps.label);
        await waitFor((): boolean => fireEvent.changeText(input, newValue));
        expect(input.props['value']).toBe(newValue);
      });
    });
  });
});
