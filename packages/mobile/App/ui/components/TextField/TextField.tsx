import React, { useCallback, useState, useRef, useMemo } from 'react';
import { KeyboardType, StyleSheet, ReturnKeyTypeOptions, TextInput } from 'react-native';
import { InputContainer, StyledTextInput } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextFieldErrorMessage } from './TextFieldErrorMessage';
import { theme } from '~/ui/styled/theme';

export interface RefObject<T> {
  readonly current: T | null;
}

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
  labelColor?: string;
  labelFontWeight?: string;
  labelFontSize?: string;
}

const styles = StyleSheet.create({
  multiLineText: {
    textAlignVertical: 'top',
  },
});

export const TextField = React.memo(
  ({
    value,
    onChange,
    label,
    labelColor,
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
    labelFontSize,
  }: TextFieldProps): JSX.Element => {
    const [focused, setFocus] = useState(false);
    const defaultRef: RefObject<any> = useRef(null);
    const ref = inputRef || defaultRef;
    const onFocusInput = useCallback((): void => {
      if (onFocus) onFocus();
      setFocus(true);
    }, [setFocus, onFocus]);
    const onBlurInput = useCallback((): void => {
      setFocus(false);
    }, [setFocus, onBlur]);

    const inputHeight = useMemo(() => {
      if (!label) return '100%';
      if (multiline) return '82%';
      return '68%';
    }, [label, multiline]);

    const styledViewHeight = useMemo(() => {
      if (multiline) return screenPercentageToDP('15.36', Orientation.Height);
      if (!label) return screenPercentageToDP('6', Orientation.Height);
      return screenPercentageToDP('8.8', Orientation.Height);
    }, [label, multiline]);

    return (
      <StyledView
        height={styledViewHeight}
        marginBottom={
          error
            ? screenPercentageToDP(3, Orientation.Height)
            : screenPercentageToDP('2.24', Orientation.Height)
        }
        width="100%"
      >
        <InputContainer>
          {!!label && (
            <TextFieldLabel
              labelColor={labelColor}
              labelFontSize={labelFontSize}
            >
              {label}
            </TextFieldLabel>
          )}
          <StyledTextInput
            disabled={disabled}
            focused={focused}
            hasValue={value?.length > 0}
            error={error}
            testID={label}
            value={!hideValue && value}
            height={inputHeight}
            ref={ref}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : autoCapitalize}
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
            style={multiline ? styles.multiLineText : styles.singleLineText}
            secureTextEntry={secure}
            placeholder={placeholder}
            blurOnSubmit={blurOnSubmit !== undefined ? blurOnSubmit : !multiline}
            maxLength={charLimit}
            onSubmitEditing={onSubmitEditing}
            placeholderTextColor={theme.colors.TEXT_SOFT}
          />
        </InputContainer>
        {!!error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
      </StyledView>
    );
  },
);

export const LimitedTextField = (props: TextFieldProps): JSX.Element => {
  const { charLimit = 255 } = props;
  return <TextField {...props} charLimit={charLimit} />;
};
