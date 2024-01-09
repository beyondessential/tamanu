import React, { useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
// Components
import { RowView, StyledText } from '/styled/common';
// Helpers
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export const SelectButton = (props: any): JSX.Element => {
  const onPressCallback = useCallback(() => props.onPress(props.value), [
    props,
  ]);

  return (
    <TouchableWithoutFeedback onPress={onPressCallback}>
      <RowView
        background={
          props.selected ? theme.colors.PRIMARY_MAIN : theme.colors.WHITE
        }
        alignItems="center"
        justifyContent="center"
        borderColor={theme.colors.PRIMARY_MAIN}
        height={screenPercentageToDP(4.25, Orientation.Height)}
        width={screenPercentageToDP(29.92, Orientation.Width)}
        paddingLeft={15}
        paddingRight={15}
        borderWidth={1}
        borderLeftWidth={props.index === 0 ? 1 : 0}
      >
        <StyledText
          color={
            props.selected ? theme.colors.WHITE : theme.colors.PRIMARY_MAIN
          }
        >
          {props.label}
        </StyledText>
      </RowView>
    </TouchableWithoutFeedback>
  );
};
