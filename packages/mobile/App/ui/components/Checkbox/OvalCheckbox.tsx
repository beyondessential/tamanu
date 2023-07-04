import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { StyledView, StyledText, RowView, StyledViewProps } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { CheckboxMarkIcon } from '../Icons';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';

interface OvalCheckboxProps extends BaseInputProps {
  onChange: Function;
  id: string;
  text: string;
  error?: string;
  value: boolean;
  required?: boolean;
  style: StyledViewProps;
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 100,
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
    elevation: 1,
    shadowColor: '#666',
  },
  checked: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.PRIMARY_MAIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unchecked: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderColor: theme.colors.BOX_OUTLINE,
    backgroundColor: theme.colors.WHITE,
    borderWidth: 1,
  },
  icon: {
    stroke: theme.colors.WHITE,
    borderColor: theme.colors.PRIMARY_MAIN,
  },
  text: {
    marginLeft: 5,
    fontSize: screenPercentageToDP('1.70', Orientation.Height),
    fontWeight: '400',
    color: theme.colors.TEXT_DARK,
  },
});

export const OvalCheckbox = ({
  value,
  onChange,
  id,
  text,
  error,
  required,
  style,
}: OvalCheckboxProps): JSX.Element => (
  <StyledView style={style}>
    <Pressable
      onPress={(): void => onChange(!value, id)}
      android_ripple={{ color: theme.colors.LIGHT_GREY, foreground: true }}
      style={styles.container}
    >
      <RowView style={styles.row}>
        {value ? (
          <StyledView style={styles.checked}>
            <CheckboxMarkIcon style={styles.icon} width={14} heigh={14} />
          </StyledView>
        ) : (
          <StyledView style={styles.unchecked} />
        )}
        {text && (
          <StyledText style={styles.text}>
            {text}
            {required && <StyledText color={theme.colors.ALERT}> *</StyledText>}
          </StyledText>
        )}
      </RowView>
    </Pressable>
    {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
  </StyledView>
);
