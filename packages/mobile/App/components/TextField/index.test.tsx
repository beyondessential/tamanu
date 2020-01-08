import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react-native';
import { BaseTextFieldStory, BaseMaskedTextFieldStory } from './fixtures';

describe('<TextField />', (): void => {
  describe('Non Masked', (): void => {
    const nonMaskedProps = {
      label: 'First Year of Registration',
    };
    const newValue = 'test';
    const { getByText, getByLabelText } = render(
      <BaseTextFieldStory {...nonMaskedProps} />,
    );
    it('should render label', (): void => {
      expect(getByText(nonMaskedProps.label)).not.toBe(null);
    });
    it('should change values', (): void => {
      const input = getByLabelText(nonMaskedProps.label);
      fireEvent.changeText(input, newValue);
      expect(input.getProp('value')).toBe(newValue);
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
      const { getByText, getByLabelText } = render(
        <BaseMaskedTextFieldStory {...phoneMaskProps} maskType="custom" />,
      );
      it('should render phone Mask', (): void => {
        expect(getByText(phoneMaskProps.label)).not.toBe(null);
      });

      it('should change values', async (): Promise<void> => {
        const input = getByLabelText(phoneMaskProps.label);
        await wait((): boolean => fireEvent.changeText(input, newValue));
        expect(input.getProp('value')).toBe(newValue);
      });
    });
  });
});
