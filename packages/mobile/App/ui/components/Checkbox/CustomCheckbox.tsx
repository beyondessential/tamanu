import React from 'react';
import { Pressable } from 'react-native';
import { StyledView, StyledText, RowView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { CheckboxMarkIcon } from '../Icons';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  id: string;
  text: string;
  value: boolean;
}

export const CustomCheckbox = ({
  value,
  onChange,
  id,
  text,
  error,
  required,
}: CheckboxProps): JSX.Element => {
  const ChangeCallback = () => onChange(!value, id);

  const Checked = (
    <StyledView
      height={20}
      width={20}
      borderRadius={10}
      background={theme.colors.PRIMARY_MAIN}
      alignItems="center"
      justifyContent="center"
    >
      <CheckboxMarkIcon
        stroke={theme.colors.WHITE}
        background={theme.colors.PRIMARY_MAIN}
        height={12}
        width={12}
      />
    </StyledView>
  );

  const UnChecked = (
    <StyledView
      height={20}
      width={20}
      borderRadius={10}
      borderColor={theme.colors.BOX_OUTLINE}
      background={theme.colors.WHITE}
      borderWidth={1}
    />
  );

  return (
    <StyledView>
      <Pressable onPress={ChangeCallback}>
        {({ pressed }) => (
          <RowView
            background={pressed ? theme.colors.LIGHT_GREY : theme.colors.WHITE}
            paddingLeft={7}
            paddingRight={15}
            paddingTop={7}
            paddingBottom={7}
            alignSelf="flex-start"
            borderRadius={100}
            alignItems="center"
          >
            {value ? Checked : UnChecked}
            {text && (
              <StyledText
                marginLeft={5}
                fontSize={screenPercentageToDP('1.70', Orientation.Height)}
                fontWeight={400}
                color={theme.colors.TEXT_DARK}
              >
                {`${text}${required ? '*' : ''}`}
              </StyledText>
            )}
          </RowView>
        )}
      </Pressable>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
