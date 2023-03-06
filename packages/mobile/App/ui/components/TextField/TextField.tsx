import React, { useCallback, useState, useRef, useMemo } from 'react';
import {
  KeyboardType,
  StyleSheet,
  ReturnKeyTypeOptions,
  TextInput,
  Text
} from 'react-native';
import styled from 'styled-components';
import { InputContainer, StyledTextInput } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextFieldErrorMessage } from './TextFieldErrorMessage';
export interface RefObject<T> {
  readonly current: T | null;
}

const Label = styled(Text)`
  color: #888;
  font-size: 14px;
  font-weight: normal;
  position: absolute;
  pointer-events: none;
  left: 5px;
  top: 10px;
  transition: 0.2s ease all;
  ${TextInput}:focus ~ & {
    top: -18px;
    font-size: 14px;
    color: #5264ae;
  }
`;

export interface TextFieldProps extends BaseInputProps {
  value: string;
  onChange: (text: string) => void;
  isOpen?: boolean;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  multiline?: boolean;
  disabled?: boolean;
  secure?: boolean;
  hints?: boolean;
  hideValue?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters' | undefined;
  onFocus?: () => void;
  onBlur?: () => void;
  charLimit?: number;
  blurOnSubmit?: boolean;
  inputRef?: RefObject<TextInput>;
  onSubmitEditing?: () => void;
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
    onFocus,
    onBlur,
    hideValue = false,
    charLimit,
    blurOnSubmit,
    inputRef,
    onSubmitEditing,
  }: TextFieldProps): JSX.Element => {
    const [focused, setFocus] = useState(false);
    const defaultRef: RefObject<any> = useRef(null);
    const ref = inputRef || defaultRef;
    const onFocusLabel = useCallback((): void => {
      if (!focused && ref.current) {
        ref.current.focus();
      } else if (focused && ref.current) {
        ref.current.blur();
      }
    }, [focused, inputRef]);
    const onFocusInput = useCallback((): void => {
      if (onFocus) onFocus();
      setFocus(true);
    }, [setFocus, onFocus]);
    const onBlurInput = useCallback((): void => {
      setFocus(false);
    }, [setFocus, onBlur]);

    const inputMarginTop = useMemo(() => {
      if (multiline) return 0;
      if (!label) return screenPercentageToDP(0.8, Orientation.Height);
      return screenPercentageToDP(1.5, Orientation.Height);
    }, []);

    return (
      <StyledView
        height={
          multiline
            ? screenPercentageToDP('13.36', Orientation.Height)
            : screenPercentageToDP('6.68', Orientation.Height)
        }
        marginBottom={error ? screenPercentageToDP(2, Orientation.Height) : 0}
        width="100%"
      >
        <InputContainer
          disabled={disabled}
          hasValue={value && value.length > 0}
          error={error}
          paddingLeft={screenPercentageToDP(1.5, Orientation.Width)}
        >
          {!multiline && label && (
            <TextFieldLabel
              error={error}
              focus={focused}
              onFocus={onFocusLabel}
              isValueEmpty={value !== ''}
            >
              {label}
            </TextFieldLabel>
          )}
          <Label>
            Hi
          </Label>
          <StyledTextInput
            testID={label}
            value={!hideValue && value}
            marginTop={inputMarginTop}
            ref={ref}
            autoCapitalize={
              keyboardType === 'email-address' ? 'none' : autoCapitalize
            }
            autoFocus={autoFocus}
            returnKeyType={returnKeyType}
            autoCorrect={hints}
            accessibilityLabel={label}
            keyboardType={keyboardType}
            onChangeText={onChange}
            onFocus={onFocusInput}
            onBlur={onBlurInput}
            multiline={multiline}
            editable={!disabled}
            style={multiline ? styles.textinput : null}
            secureTextEntry={secure}
            placeholder={placeholder}
            blurOnSubmit={blurOnSubmit !== undefined ? blurOnSubmit : !multiline}
            maxLength={charLimit}
            onSubmitEditing={onSubmitEditing}
            placeholderTextColor="#888888"
          />
        </InputContainer>
        {error && (
          <TextFieldErrorMessage>
            {error}
          </TextFieldErrorMessage>
        )}
      </StyledView>
    );
  },
);

export const LimitedTextField = (props: TextFieldProps): JSX.Element => {
  const { charLimit = 255 } = props;
  return <TextField {...props} charLimit={charLimit} />;
};
