import React, { useState, useRef, Ref } from 'react';
import { TextInput, KeyboardType } from 'react-native';
import { InputContainer, StyledTextInput } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView } from '../../styled/common';
import { Orientation, screenPercentageToDp } from '../../helpers/screen';

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
  multiline?: boolean;
}

export const TextField = React.memo(
  ({
    value,
    onChange,
    label,
    error,
    keyboardType,
    multiline,
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
      onChangeText: onChange,
      onFocus,
      onBlur,
      value,
      focused,
      multiline,
    };

    return (
      <StyledView
        height={
          multiline
            ? screenPercentageToDp('13.36', Orientation.Height)
            : screenPercentageToDp('6.68', Orientation.Height)
        }
        width="100%"
      >
        <InputContainer hasValue={value.length > 0} error={error}>
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
          <StyledTextInput ref={inputRef} {...inputProps} />
        </InputContainer>
      </StyledView>
    );
  },
);
