import React, { useState, useCallback, ReactElement } from 'react';
import { TouchableWithoutFeedback, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parseISO } from 'date-fns';
import { StyledView, StyledText } from '/styled/common';
import { formatDate } from '/helpers/date';
import { theme } from '/styled/theme';
import { DateFormats } from '/helpers/constants';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import * as Icons from '../Icons';
import { TextFieldLabel } from '../TextField/TextFieldLabel';
import { InputContainer } from '../TextField/styles';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';

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

type DatePickerProps = {
  onDateChange: (event: any, selectedDate: any) => void;
  isVisible: boolean;
  mode: 'date' | 'time';
  value: Date;
  min?: Date;
  max?: Date;
};

const DatePicker = ({
  onDateChange,
  isVisible,
  mode,
  value,
  min,
  max,
}: DatePickerProps): ReactElement =>
  isVisible ? (
    <DateTimePicker
      value={value}
      mode={mode}
      display="spinner"
      onChange={onDateChange}
      style={styles.androidPickerStyles}
      maximumDate={max}
      minimumDate={min}
    />
  ) : null;

export interface DateFieldProps extends BaseInputProps {
  value: Date | string;
  onChange: (date: Date) => void;
  placeholder?: '' | string;
  mode?: 'date' | 'time';
  disabled?: boolean;
  min?: Date;
  max?: Date;
}

export const DateField = React.memo(
  ({
    value,
    onChange,
    label,
    error,
    min,
    max,
    mode = 'date',
    disabled = false,
    required = false,
  }: DateFieldProps) => {
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const showDatePicker = useCallback(() => setDatePickerVisible(true), []);
    const onAndroidDateChange = useCallback(
      (event, selectedDate) => {
        if (selectedDate) {
          setDatePickerVisible(false);
          onChange(selectedDate);
        }
        setDatePickerVisible(false);
      },
      [onChange],
    );

    const dateValue = value && (value instanceof Date ? value : parseISO(value));

    const formatValue = useCallback(() => {
      if (value) {
        if (mode === 'date') return formatDate(dateValue, DateFormats.DDMMYY);
        return formatDate(dateValue, DateFormats.TIME_HHMMSS);
      }
      return null;
    }, [mode, value]);

    const IconComponent = mode === 'date' ? Icons.CalendarIcon : Icons.ClockIcon;

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
                marginTop={
                  label
                    ? screenPercentageToDP(2.2, Orientation.Height)
                    : screenPercentageToDP(1.2, Orientation.Height)
                }
              >
                {formatValue()}
              </StyledText>
              <StyledView marginRight={10} height="100%" justifyContent="center">
                <IconComponent
                  height={screenPercentageToDP(3.03, Orientation.Height)}
                  width={screenPercentageToDP(3.03, Orientation.Height)}
                  fill={error ? theme.colors.ERROR : theme.colors.BOX_OUTLINE}
                />
              </StyledView>
            </InputContainer>
          </TouchableWithoutFeedback>
        </StyledView>
        {// see: https://github.com/react-native-datetimepicker/datetimepicker/issues/182#issuecomment-643156239
        React.useMemo(
          () => (
            <DatePicker
              onDateChange={onAndroidDateChange}
              mode={mode}
              isVisible={isDatePickerVisible}
              value={dateValue || new Date()}
              min={min}
              max={max}
            />
          ),
          [isDatePickerVisible],
        )}
        {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
      </StyledView>
    );
  },
);
