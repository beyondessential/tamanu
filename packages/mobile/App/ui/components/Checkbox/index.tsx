import React, { useCallback } from 'react';
import { TouchableHighlight } from 'react-native';
import { StyledView, StyledText, RowView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { CheckboxMarkIcon } from '../Icons';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  id: string;
  text: string;
  value: boolean;
  background?: string;
  color?: string;
}

export const Checkbox = ({
  value,
  onChange,
  id,
  text,
  error,
  required,
  background,
  color,
}: CheckboxProps): JSX.Element => {
  const ChangeCallback = useCallback(() => onChange(!value, id), [onChange, value]);

  const getColor = useCallback(() => {
    if (error) return theme.colors.ERROR;
    if (!value) return theme.colors.BOX_OUTLINE;
    return theme.colors.PRIMARY_MAIN;
  }, [error, value]);
  return (
    <RowView alignItems="center">
      <TouchableHighlight
        onPress={ChangeCallback}
        underlayColor="rgba(0,0,0,0.1)"
      >
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
          fontSize={screenPercentageToDP('1.70', Orientation.Height)}
          color={theme.colors.TEXT_MID}
        >
          {`${text}${required ? '*' : ''}`}
        </StyledText>
      )}
    </RowView>
  );
};

Checkbox.defaultProps = {
  background: theme.colors.WHITE,
  color: theme.colors.PRIMARY_MAIN,
};
