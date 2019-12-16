import React, { useState, useRef, Ref } from 'react';
import { TextInput, KeyboardType } from 'react-native';
import {
  TextInputMaskTypeProp,
  TextInputMaskOptionProp,
  TextInputMask,
} from 'react-native-masked-text';
import { InputContainer, StyledMaskedInput } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView } from '../../styled/common';

export interface RefObject<T> {
  readonly current: T | null;
}

export interface TextFieldProps {
  value: string;
  onChange: (text: string) => void;
  isOpen?: boolean;
  label?: '' | string;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  error?: '' | string;
  masked?: boolean;
  maskType?: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
  datePicker?: boolean;
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
  }: TextFieldProps) => {
    const [focused, setFocus] = useState(false);
    const inputRef: Ref<TextInput> = useRef(null);
    const maskedInputRef: any = useRef(null);
    const onFocusInput = React.useCallback(() => {
      if (!focused) {
        maskedInputRef.current._inputElement.focus();
      } else {
        maskedInputRef.current._inputElement.blur();
      }
    }, [focused, maskedInputRef]);
    const onFocus = React.useCallback(() => setFocus(true), [setFocus]);
    const onBlur = React.useCallback(() => setFocus(false), [setFocus]);

    const inputProps = {
      accessibilityLabel: label,
      keyboardType,
      onChangeText: onChange,
      onFocus,
      onBlur,
      value,
      focused,
    };

    return (
      <StyledView height="55" width="100%">
        <InputContainer hasValue={value.length > 0} error={error}>
          {label && (
            <TextFieldLabel
              error={error}
              focus={focused}
              onFocus={onFocusInput}
              isValueEmpty={value !== ''}>
              {label}
            </TextFieldLabel>
          )}
          <StyledMaskedInput
            as={TextInputMask}
            ref={maskedInputRef}
            options={options}
            type={maskType}
            {...inputProps}
          />
        </InputContainer>
      </StyledView>
    );
  },
);
