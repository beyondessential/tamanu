import React, { useCallback } from 'react';
import { TouchableHighlight } from 'react-native';
import { StyledView, StyledText, RowView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { CheckboxMark } from '../Icons';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  text: string;
  value: boolean;
}

export const Checkbox = ({
  value,
  onChange,
  text,
  error,
  required,
}: CheckboxProps): JSX.Element => {
  const ChangeCallback = useCallback(() => onChange(!value), [
    onChange,
    value,
  ]);

  const getColor = useCallback(
    () => {
      if (error) return theme.colors.ERROR;
      if (!value) return theme.colors.BOX_OUTLINE;
      return theme.colors.PRIMARY_MAIN;
    },
    [error, value],
  );
  return (
    <RowView>
      <TouchableHighlight
        onPress={ChangeCallback}
        underlayColor="rgba(0,0,0,0.1)"
      >
        <StyledView
          height={screenPercentageToDP('1.82', Orientation.Height)}
          width={screenPercentageToDP('1.82', Orientation.Height)}
          background={theme.colors.WHITE}
          borderRadius={3}
          borderColor={getColor()}
          borderWidth={1}
          alignItems="center"
          justifyContent="center"
        >
          {value && <CheckboxMark height={10} width={10} />}
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
