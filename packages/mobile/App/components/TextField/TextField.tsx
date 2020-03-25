import React, { useState, useRef, Ref, useMemo } from 'react';
import { KeyboardType, StyleSheet, Platform, ReturnKeyTypeOptions } from 'react-native';
import { InputContainer, StyledTextInput } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView } from '../../styled/common';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
export interface RefObject<T> {
  readonly current: T | null;
}

export interface TextFieldProps extends BaseInputProps{
  value: string;
  onChange: (text: string) => void;
  isOpen?: boolean;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  multiline?: boolean;
  disabled?: boolean;
  secure?: boolean;
  hints?: boolean;
  returnKeyType?: ReturnKeyTypeOptions,
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters' | undefined;
}


const styles = StyleSheet.create({
  textinput: {
    textAlignVertical: 'top',
  },
});

export const TextField = React.memo(
  ({
    value,
    onChange,
    label,
    error,
    keyboardType,
    multiline = false,
    placeholder,
    disabled,
    secure = false,
    hints = false,
    returnKeyType = 'done',
    autoFocus = false,
    autoCapitalize = 'words',
  }: TextFieldProps): JSX.Element => {
    const [focused, setFocus] = useState(false);
    const inputRef: Ref<any> = useRef(null);
    const onFocusInput = React.useCallback((): void => {
      if (!focused && inputRef.current) {
        inputRef.current.focus();
      } else if (focused && inputRef.current) {
        inputRef.current.blur();
      }
    }, [focused, inputRef]);
    const onFocus = React.useCallback((): void => setFocus(true), [setFocus]);
    const onBlur = React.useCallback((): void => setFocus(false), [setFocus]);

    const inputProps = {
      autoCapitalize,
      autoFocus,
      returnKeyType,
      autoCorrect: hints,
      accessibilityLabel: label,
      keyboardType,
      onChangeText: onChange,
      onFocus,
      onBlur,
      value,
      focused,
      multiline,
      editable: !disabled,
      style: multiline ? styles.textinput : null,
      secureTextEntry: secure,
      placeholder,
    };

    const inputMarginTop = useMemo(() => {
      if (placeholder) return 0;
      if (Platform.OS === 'ios') return screenPercentageToDP(1, Orientation.Height);
      return screenPercentageToDP(0.5, Orientation.Height);
    }, []);

    return (
      <StyledView
        height={
          multiline
            ? screenPercentageToDP('13.36', Orientation.Height)
            : screenPercentageToDP('6.68', Orientation.Height)
        }
        width="100%"
      >
        <InputContainer
          disabled={disabled}
          hasValue={value.length > 0}
          error={error}
          paddingLeft={
            Platform.OS === 'ios'
              ? screenPercentageToDP(2.0, Orientation.Width)
              : screenPercentageToDP(1.5, Orientation.Width)
          }
        >
          {!multiline && label && (
            <TextFieldLabel
              error={error}
              focus={focused}
              onFocus={onFocusInput}
              isValueEmpty={value !== ''}
            >
              {label}
            </TextFieldLabel>
          )}
          <StyledTextInput
            marginTop={inputMarginTop}
            ref={inputRef}
            {...inputProps}
          />
        </InputContainer>
      </StyledView>
    );
  },
);
