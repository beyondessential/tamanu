import React from 'react';
import styled from 'styled-components/native';
import theme from '../../styled/theme';
import { TouchableWithoutFeedback } from 'react-native';
import { StyledView, RowView } from '../../styled/common';
import { ColorHelper } from '../../helpers/colors';

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
interface RadioButtonText {
  selected?: boolean;
  error?: boolean;
}

const StyledButtonText = styled.Text<RadioButtonText>`
  font-size: 14;
  line-height: 16;
  color: ${({ selected, error }) => {
    if (error) return theme.colors.ALERT;
    if (selected) return theme.colors.TEXT_DARK;
    return theme.colors.TEXT_MID;
  }};
`;

export default (props: RadioOptionProps) => {
  return (
    <TouchableWithoutFeedback onPress={() => props.onPress(props.value)}>
      <RowView
        alignItems="center"
        justifyContent="center"
        height="55"
        borderColor={
          props.error
            ? ColorHelper.halfTransparency(theme.colors.ALERT)
            : theme.colors.TEXT_SOFT
        }
        paddingLeft="15"
        paddingRight="15"
        borderWidth="1"
        borderLeftWidth={props.index === 0 ? '1' : '0'}>
        <StyledView
          borderRadius="50"
          height="12"
          width="12"
          borderWidth="1"
          borderColor={
            props.error
              ? ColorHelper.halfTransparency(theme.colors.ALERT)
              : !props.selected
              ? theme.colors.TEXT_MID
              : theme.colors.PRIMARY_MAIN
          }
          justifyContent="center"
          alignItems="center"
          marginRight="10">
          <StyledView
            height="6"
            width="6"
            borderRadius="50"
            background={
              props.selected ? theme.colors.PRIMARY_MAIN : theme.colors.WHITE
            }
          />
        </StyledView>
        <StyledButtonText error={props.error} selected={props.selected}>
          {props.value}
        </StyledButtonText>
      </RowView>
    </TouchableWithoutFeedback>
  );
};
