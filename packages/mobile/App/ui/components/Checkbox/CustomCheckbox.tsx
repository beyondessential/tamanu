import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
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

const styles = StyleSheet.create({
  checked: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.PRIMARY_MAIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unchecked: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderColor: theme.colors.BOX_OUTLINE,
    backgroundColor: theme.colors.WHITE,
    borderWidth: 1,
  },
  icon: {
    stroke: theme.colors.WHITE,
    borderColor: theme.colors.PRIMARY_MAIN,
    height: 10,
    width: 10,
  },
  row: {
    backgroundColor: theme.colors.WHITE,
    paddingLeft: 7,
    paddingRight: 15,
    paddingTop: 7,
    paddingBottom: 7,
    alignSelf: 'flex-start',
    borderRadius: 100,
    alignItems: 'center',
  },
  text: {
    marginLeft: 5,
    fontSize: screenPercentageToDP('1.70', Orientation.Height),
    fontWeight: '400',
    color: theme.colors.TEXT_DARK,
  },
});

export const CustomCheckbox = ({
  value,
  onChange,
  id,
  text,
  error,
  required,
}: CheckboxProps): JSX.Element => (
  <StyledView>
    <Pressable
      onPress={() => onChange(!value, id)}
      android_ripple={{ color: theme.colors.LIGHT_GREY, foreground: true }}
      style={{ alignSelf: 'flex-start', borderRadius: 100, overflow: 'hidden' }}
    >
      <RowView style={styles.row}>
        {value ? (
          <StyledView style={styles.checked}>
            <CheckboxMarkIcon style={styles.icon} />
          </StyledView>
        ) : (
          <StyledView style={styles.unchecked} />
        )}
        {text && <StyledText style={styles.text}>{`${text}${required ? '*' : ''}`}</StyledText>}
      </RowView>
    </Pressable>
    {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
  </StyledView>
);
