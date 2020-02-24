import React from 'react';
import { TouchableHighlight } from 'react-native';
import { StyledView, StyledText, RowView } from '../../styled/common';
import { CheckboxMark } from '../Icons';
import { theme } from '../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';

interface CheckboxProps {
  value: boolean;
  onChange: Function;
  text: string;
}

export const Checkbox = ({
  value,
  onChange,
  text,
}: CheckboxProps): JSX.Element => {
  const ChangeCallback = React.useCallback(() => onChange(!value), [
    onChange,
    value,
  ]);
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
          borderColor={
            value ? theme.colors.PRIMARY_MAIN : theme.colors.BOX_OUTLINE
          }
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
          {text}
        </StyledText>
      )}
    </RowView>
  );
};
