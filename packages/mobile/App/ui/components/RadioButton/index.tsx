import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { theme } from '/styled/theme';
import { StyledView, RowView, StyledText } from '/styled/common';
import { ColorHelper } from '/helpers/colors';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export interface FormField {
  value: string;
  selected?: boolean;
  error?: string;
  index?: number;
}

export interface RadioOption extends FormField {
  label: string;
}

export interface RadioOptionProps extends RadioOption {
  onPress: Function;
  value: string;
}

export const RadioButton = (props: RadioOptionProps): JSX.Element => {
  const onPressCallback = React.useCallback(() => props.onPress(props.value), [props]);

  const getBorderColor = useCallback(() => {
    if (props.selected) return theme.colors.PRIMARY_MAIN;
    if (props.error) return theme.colors.ALERT;
    return theme.colors.DEFAULT_OFF;
  }, [props.error, props.selected]);

  return (
    <TouchableWithoutFeedback onPress={onPressCallback}>
      <RowView
        marginRight={screenPercentageToDP(1.21, Orientation.Width)}
        background={theme.colors.WHITE}
        alignItems="center"
        justifyContent="center"
        height={screenPercentageToDP(6, Orientation.Height)}
        borderColor={getBorderColor(props)}
        paddingLeft={12}
        paddingRight={25}
        borderWidth={1}
        borderRadius={5}
        borderLeftWidth={1}
      >
        <StyledView
          borderRadius={50}
          height={12}
          width={12}
          borderWidth={1}
          borderLeftWidth={1}
          borderColor={theme.colors.TEXT_MID}
          justifyContent="center"
          alignItems="center"
          marginRight={5}
        >
          <StyledView
            height={6}
            width={6}
            borderRadius={50}
            background={props.selected ? theme.colors.PRIMARY_MAIN : theme.colors.WHITE}
          />
        </StyledView>
        <StyledText
          fontSize={screenPercentageToDP(2, Orientation.Height)}
          color={theme.colors.TEXT_DARK}
        >
          {props.label}
        </StyledText>
      </RowView>
    </TouchableWithoutFeedback>
  );
};
