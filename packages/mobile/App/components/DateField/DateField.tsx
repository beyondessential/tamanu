import React, { useState, useCallback } from 'react';
import { TouchableWithoutFeedback, Platform, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DatePicker from '@vinipachecov/react-native-datepicker';
import { StyledView, StyledText } from '/styled/common';
import { formatDate } from '/helpers/date';
import { theme } from '/styled/theme';
import { DateFormats, TimeFormats } from '/helpers/constants';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import * as Icons from '../Icons';
import { TextFieldLabel } from '../TextField/TextFieldLabel';
import { InputContainer } from '../TextField/styles';
import { BaseInputProps } from '/interfaces/BaseInputProps';

const styles = StyleSheet.create({
  androidPickerStyles: {
    backgroundColor: 'red',
    position: 'absolute',
    borderWidth: 0,
    borderColor: 'white',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
});

export interface DateFieldProps extends BaseInputProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: '' | string;
  mode?: 'date' | 'time';
  disabled?: boolean
}

export const DateField = React.memo(
  ({ value, onChange, label, error, mode = 'date', disabled = false, required = false }: DateFieldProps) => {
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const showDatePicker = useCallback(() => setDatePickerVisible(true), []);
    const hideDatePicker = useCallback(() => setDatePickerVisible(false), []);
    const onDateChange = useCallback(
      (date: string) => onChange(new Date(date)),
      [onChange],
    );

    const getDateStr = useCallback((date: Date) => date.toISOString(), []);

    const formatValue = useCallback(() => {
      if (value) {
        if (mode === 'date') return formatDate(value, DateFormats.DDMMYY);
        return formatDate(value, TimeFormats.HHMMSS);
      }
      return null;
    }, [mode, value]);

    const onDateConfirm = useCallback(
      (date: Date) => {
        setDatePickerVisible(false);
        onChange(date);
      },
      [onChange],
    );

    const IconComponent = mode === 'date' ? Icons.Calendar : Icons.Clock;

    return (
      <StyledView width="100%">
        <StyledView height={screenPercentageToDP('6.68', Orientation.Height)} width="100%">
          <TouchableWithoutFeedback onPress={showDatePicker}>
            <InputContainer
              disabled={disabled}
              hasValue={value !== null}
              error={error}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingLeft={screenPercentageToDP(2.82, Orientation.Width)}
            >
              {label && (
                <TextFieldLabel
                  error={error}
                  focus={disabled ? false : isDatePickerVisible}
                  onFocus={showDatePicker}
                  isValueEmpty={value !== null}
                >
                  {`${label}${required ? '*' : ''}`}
                </TextFieldLabel>
              )}
              <StyledText
                fontSize={screenPercentageToDP(2.18, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
                marginTop={screenPercentageToDP(1.2, Orientation.Height)}
              >
                {formatValue()}
              </StyledText>
              <StyledView
                marginRight={10}
                height="100%"
                justifyContent="center"
              >
                <IconComponent
                  height={screenPercentageToDP(3.03, Orientation.Height)}
                  width={screenPercentageToDP(3.03, Orientation.Height)}
                  fill={error ? theme.colors.ERROR : theme.colors.BOX_OUTLINE}
                />
              </StyledView>

            </InputContainer>
          </TouchableWithoutFeedback>
        </StyledView>
        {Platform.OS === 'ios' ? (
          <DateTimePickerModal
            isVisible={disabled ? false : isDatePickerVisible}
            mode={mode}
            onConfirm={onDateConfirm}
            onCancel={hideDatePicker}
          />
        ) : (
          <DatePicker
            date={null}
            androidMode="spinner"
            mode={mode}
            disabled={disabled}
            style={styles.androidPickerStyles}
            showIcon={false}
            onOpenModal={showDatePicker}
            onCloseModal={hideDatePicker}
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            format="YYYY-MM-DD"
            getDateStr={getDateStr}
            onDateChange={onDateChange}
          />
        )}
      </StyledView>
    );
  },
);
