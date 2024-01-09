import React, { useState, useRef } from 'react';
import { KeyboardType, ReturnKeyTypeOptions } from 'react-native';
import {
  TextInputMaskTypeProp,
  TextInputMaskOptionProp,
  TextInputMask,
} from 'react-native-masked-text';
import { StyledView } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { InputContainer, StyledMaskedInput } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { RefObject } from './TextField';

export interface TextFieldProps extends BaseInputProps {
  value: string;
  onChange: (text: string) => void;
  isOpen?: boolean;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  masked?: boolean;
  maskType?: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
  datePicker?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
}

export const MaskedTextField = React.memo(
  ({
    value,
    onChange,
    label,
    error,
    maskType = 'cnpj',
    options,
    keyboardType,
    returnKeyType = 'done',
  }: TextFieldProps): JSX.Element => {
    const [focused, setFocus] = useState(false);
    const maskedInputRef: RefObject<any> = useRef(null);
    const onFocusInput = React.useCallback((): void => {
      /* eslint-disable  no-underscore-dangle */
      if (!focused && maskedInputRef.current) {
        maskedInputRef.current._inputElement.focus();
      } else {
        maskedInputRef.current._inputElement.blur();
      }
    }, [focused, maskedInputRef]);
    const onFocus = React.useCallback((): void => setFocus(true), [setFocus]);
    const onBlur = React.useCallback((): void => setFocus(false), [setFocus]);

    const inputProps = {
      returnKeyType,
      accessibilityLabel: label,
      keyboardType,
      onChangeText: onChange,
      onFocus,
      onBlur,
      value,
      focused,
      style: {
        paddingTop: 0,
        marginTop: 0,
      },
    };

    return (
      <StyledView
        height={screenPercentageToDP('6.68', Orientation.Height)}
        width="100%"
      >
        <InputContainer
          hasValue={value && value.length > 0}
          error={error}
          paddingLeft={screenPercentageToDP(1.5, Orientation.Width)}
        >
          {label && (
            <TextFieldLabel
              error={error}
              focus={focused}
              onFocus={onFocusInput}
              isValueEmpty={value !== ''}
            >
              {label}
            </TextFieldLabel>
          )}
          <StyledMaskedInput
            as={TextInputMask}
            ref={maskedInputRef}
            options={options}
            type={maskType}
            {...inputProps}
            returnKeyType="done"
          />
        </InputContainer>
      </StyledView>
    );
  },
);
