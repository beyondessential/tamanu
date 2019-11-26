import React, { useState, useRef } from 'react';
import { InputContainer, StyledTextInput, StyledMaskedInput } from './styles';
import { TextInput, KeyboardType } from 'react-native';
import TextFieldLabel from './TextFieldLabel';
import { StyledView } from '../../styled/common';
import {
  TextInputMaskTypeProp,
  TextInputMaskOptionProp,
  TextInputMask,
} from 'react-native-masked-text';

interface RefObject<T> {
  readonly current: T | null;
}

export interface TextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  isOpen?: boolean;
  label?: '' | string;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  error?: '' | string;
  masked?: boolean;
  maskType?: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
}

export const TextField = React.memo(
  ({
    value,
    onChangeText,
    label,
    error,
    maskType = 'cnpj',
    options,
    masked = false,
    keyboardType,
  }: TextFieldProps) => {
    const [focused, setFocus] = useState(false);
    const inputRef: RefObject<TextInput> = useRef(null);
    const maskedInputRef: any = useRef(null);
    const onFocusInput = React.useCallback(() => {
      if (!focused) {
        inputRef.current
          ? inputRef.current.focus()
          : maskedInputRef.current._inputElement.focus();
      } else {
        inputRef.current
          ? inputRef.current!.blur()
          : maskedInputRef.current._inputElement.blur();
      }
    }, [focused, maskedInputRef, inputRef]);
    const onFocus = React.useCallback(() => setFocus(true), [setFocus]);
    const onBlur = React.useCallback(() => setFocus(false), [setFocus]);

    const inputProps = {
      accessibilityLabel: label,
      keyboardType,
      onChangeText,
      onFocus,
      onBlur,
      value,
    };

    return (
      <StyledView height="55" width="100%">
        <InputContainer hasValue={value.length > 0} error={error}>
          {label && (
            <TextFieldLabel
              error={error}
              focus={focused}
              onFocus={onFocusInput}
              inputValue={value}>
              {label}
            </TextFieldLabel>
          )}
          {!masked ? (
            <StyledTextInput ref={inputRef} {...inputProps} />
          ) : (
            <StyledMaskedInput
              as={TextInputMask}
              ref={maskedInputRef}
              options={options}
              type={maskType}
              {...inputProps}
            />
          )}
        </InputContainer>
      </StyledView>
    );
  },
);
