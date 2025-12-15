import React, { useCallback } from 'react';
import { TouchableHighlight } from 'react-native';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { CheckboxMarkIcon } from '../Icons';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';
import { TranslatedTextElement } from '../Translations/TranslatedText';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  id: string;
  text: TranslatedTextElement;
  value: boolean;
  background?: string;
  color?: string;
  error?: string;
  required?: boolean;
  label?: string;
  fieldFontSize?: string | number;
  fieldColor?: string;
}

export const Checkbox = ({
  value,
  onChange,
  id,
  text,
  error,
  required = false,
  background = theme.colors.WHITE,
  color = theme.colors.PRIMARY_MAIN ,
  label,
  fieldFontSize,
  fieldColor,
}: CheckboxProps): JSX.Element => {
  const ChangeCallback = useCallback(() => onChange(!value, id), [onChange, value, id]);

  const getColor = useCallback(() => {
    if (error) return theme.colors.ERROR;
    if (!value) return theme.colors.BOX_OUTLINE;
    return theme.colors.PRIMARY_MAIN;
  }, [error, value]);
  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)}>
      {!!label && (
        <StyledText
          fontSize={14}
          fontWeight={600}
          marginBottom={2}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {label}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      <RowView alignItems="center">
        <TouchableHighlight onPress={ChangeCallback} underlayColor="rgba(0,0,0,0.1)">
          <StyledView
            height={screenPercentageToDP('2.82', Orientation.Height)}
            width={screenPercentageToDP('2.82', Orientation.Height)}
            background={background}
            borderRadius={5}
            borderColor={getColor()}
            borderWidth={1}
            alignItems="center"
            justifyContent="center"
          >
            {value && (
              <CheckboxMarkIcon
                stroke={color}
                height={screenPercentageToDP('1.82', Orientation.Height)}
                width={screenPercentageToDP('1.82', Orientation.Height)}
              />
            )}
          </StyledView>
        </TouchableHighlight>
        {text && (
          <StyledText
            marginLeft={10}
            onPress={ChangeCallback}
            fontSize={fieldFontSize || screenPercentageToDP('1.70', Orientation.Height)}
            color={fieldColor || theme.colors.TEXT_MID}
          >
            {`${text?.props?.fallback || text}${required && !label ? '*' : ''}`}
          </StyledText>
        )}
      </RowView>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
