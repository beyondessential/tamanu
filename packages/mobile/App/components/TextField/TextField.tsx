import React, { useState, useRef, Ref } from 'react';
import { InputContainer, StyledTextInput } from './styles';
import { TextInput, KeyboardType } from 'react-native';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView } from '../../styled/common';

export interface RefObject<T> {
  readonly current: T | null;
}

export interface TextFieldProps {
  value: string;
  onChange: (text: string) => void;
  isOpen?: boolean;
  label: '' | string;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  error?: '' | string;
}

export const TextField = React.memo(
  ({
    value,
    onChange: onChangeText,
    label,
    error,
    keyboardType,
  }: TextFieldProps) => {
    const [focused, setFocus] = useState(false);
    const inputRef: Ref<TextInput> = useRef(null);
    const onFocusInput = React.useCallback(() => {
      if (!focused) {
        inputRef.current!.focus();
      } else {
        inputRef.current!.blur();
      }
    }, [focused, inputRef]);
    const onFocus = React.useCallback(() => setFocus(true), [setFocus]);
    const onBlur = React.useCallback(() => setFocus(false), [setFocus]);

    const inputProps = {
      accessibilityLabel: label,
      keyboardType,
      onChangeText,
      onFocus,
      onBlur,
      value,
      focused,
    };

    return (
      <StyledView height="55" width="100%">
        <InputContainer hasValue={value.length > 0} error={error}>
          <TextFieldLabel
            error={error}
            focus={focused}
            onFocus={onFocusInput}
            isValueEmpty={value !== ''}>
            {label}
          </TextFieldLabel>
          <StyledTextInput ref={inputRef} {...inputProps} />
        </InputContainer>
      </StyledView>
    );
  },
);
