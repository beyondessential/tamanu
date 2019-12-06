import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react-native';
import {
  BaseTextFieldStory,
  BaseMaskedTextFieldStory,
  BaseDateTextFieldStory,
} from './fixtures';
import { DateFormats } from '../../helpers/constants';
import { jsxEmptyExpression } from '@babel/types';
import { formatDate } from '../../helpers/date';
import { act } from 'react-test-renderer';

describe('<TextField />', () => {
  describe('Non Masked', () => {
    const nonMaskedProps = {
      label: 'First Year of Registration',
    };
    const newValue = 'test';
    const { getByText, getByLabelText } = render(
      <BaseTextFieldStory {...nonMaskedProps} />,
    );
    it('should render label', () => {
      expect(getByText(nonMaskedProps.label)).not.toBe(null);
    });
    it('should change values', async () => {
      const input = getByLabelText(nonMaskedProps.label);
      fireEvent.changeText(input, newValue);
      expect(input.getProp('value')).toBe(newValue);
    });
  });

  describe('Masked', () => {
    describe('Phone Mask', () => {
      const phoneMaskProps = {
        masked: true,
        options: {
          mask: '9999 9999 999',
        },
        label: 'Phone',
      };
      const newValue = '1234';
      const { getByText, getByLabelText } = render(
        <BaseMaskedTextFieldStory {...phoneMaskProps} maskType={'custom'} />,
      );
      it('should render phone Mask', () => {
        expect(getByText(phoneMaskProps.label)).not.toBe(null);
      });

      it('should change values', async () => {
        const input = getByLabelText(phoneMaskProps.label);
        await wait(() => fireEvent.changeText(input, newValue));
        expect(input.getProp('value')).toBe(newValue);
      });
    });
  });
});
