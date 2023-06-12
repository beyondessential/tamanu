import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { theme } from '/styled/theme';
import { StyledView, RowView, StyledText } from '/styled/common';
import { ColorHelper } from '/helpers/colors';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export interface FormField {
  value: string;
  selected?: boolean;
  error?: boolean;
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

  const getLabelColor = useCallback(() => {
    if (props.selected) return theme.colors.TEXT_DARK;
    return theme.colors.TEXT_MID;
  }, [props.error, props.selected]);

  return (
    <TouchableWithoutFeedback onPress={onPressCallback}>
      <RowView
        marginLeft={screenPercentageToDP(1.21, Orientation.Width)}
        background={theme.colors.WHITE}
        alignItems="center"
        justifyContent="center"
        height={screenPercentageToDP('6.68', Orientation.Height)}
        borderColor={
          props.error ? ColorHelper.halfTransparency(theme.colors.ALERT) : theme.colors.DEFAULT_OFF
        }
        paddingLeft={15}
        paddingRight={15}
        borderWidth={1}
        borderRadius={3}
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
          marginRight={10}
        >
          <StyledView
            height={6}
            width={6}
            borderRadius={50}
            background={props.selected ? theme.colors.PRIMARY_MAIN : theme.colors.WHITE}
          />
        </StyledView>
        <StyledText
          fontSize={screenPercentageToDP(1.7, Orientation.Height)}
          color={getLabelColor()}
        >
          {props.label}
        </StyledText>
      </RowView>
    </TouchableWithoutFeedback>
  );
};
