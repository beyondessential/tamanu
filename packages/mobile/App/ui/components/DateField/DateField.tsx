import React, { ReactElement, useCallback, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parseISO, formatISO9075 } from 'date-fns';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';
import * as Icons from '../Icons';
import { InputContainer } from '../TextField/styles';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';

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
  mode: 'date' | 'time' | 'datetime';
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
}: DatePickerProps): ReactElement => {
  if (!isVisible) return null;

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display="spinner"
      onChange={onDateChange}
      style={styles.androidPickerStyles}
      maximumDate={max}
      minimumDate={min}
    />
  );
};

export interface DateFieldProps extends BaseInputProps {
  value: Date | string;
  onChange: (date: Date | string) => void;
  placeholder?: '' | string;
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean;
  min?: Date;
  max?: Date;
  labelFontSize?: number | string;
  fieldFontSize?: number | string;
  labelColor?: string;
  saveDateAsString?: boolean;
  useTimezone?: boolean;
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
    placeholder,
    labelFontSize = screenPercentageToDP(2.1, Orientation.Height),
    labelColor = theme.colors.TEXT_SUPER_DARK,
    fieldFontSize = screenPercentageToDP(2.18, Orientation.Height),
  }: DateFieldProps) => {
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [currentPickerMode, setCurrentPickerMode] = useState<'date' | 'time'>('date');
    const [tempDate, setTempDate] = useState<Date | null>(null);
    const { formatShort, formatTime, formatShortDateTime } = useDateTimeFormat();

    const showDatePicker = useCallback(() => {
      setDatePickerVisible(true);
      if (mode === 'datetime') {
        setCurrentPickerMode('date');
      } else {
        setCurrentPickerMode(mode as 'date' | 'time');
      }
    }, [mode]);

    const onAndroidDateChange = useCallback(
      (event, selectedDate) => {
        if (selectedDate) {
          if (mode === 'datetime') {
            if (currentPickerMode === 'date') {
              setTempDate(selectedDate);
              setCurrentPickerMode('time');
              setDatePickerVisible(true);
              return;
            } else {
              const combinedDateTime = new Date(tempDate!);
              combinedDateTime.setHours(selectedDate.getHours());
              combinedDateTime.setMinutes(selectedDate.getMinutes());
              combinedDateTime.setSeconds(selectedDate.getSeconds());
              setDatePickerVisible(false);
              setTempDate(null);
              onChange(combinedDateTime);
              return;
            }
          }
          setDatePickerVisible(false);
          onChange(selectedDate);
        } else {
          setDatePickerVisible(false);
          setTempDate(null);
        }
      },
      [onChange, mode, currentPickerMode, tempDate],
    );

    const dateValue = value && (value instanceof Date ? value : parseISO(value));
    const isoValue = typeof value === 'string' ? value : dateValue?.toISOString();

    const formatValue = useCallback(() => {
      if (!isoValue) return null;
      if (mode === 'date') return formatShort(isoValue);
      if (mode === 'time') return formatTime(isoValue);
      if (mode === 'datetime') return formatShortDateTime(isoValue);
      return null;
    }, [mode, isoValue, formatShort, formatTime, formatShortDateTime]);

    const IconComponent = mode === 'time' ? Icons.ClockIcon : Icons.CalendarIcon;

    const formattedValue = formatValue();

    const getPlaceholder = () => {
      if (placeholder) return placeholder;
      if (mode === 'datetime') return 'dd/mm/yyyy hh:mm';
      if (mode === 'time') return 'hh:mm';
      return 'dd/mm/yyyy';
    };

    return (
      <StyledView marginBottom={screenPercentageToDP(2.24, Orientation.Height)} width="100%">
        {!!label && (
          <StyledText fontSize={labelFontSize} fontWeight={600} marginBottom={2} color={labelColor}>
            {label}
            {required && <RequiredIndicator />}
          </StyledText>
        )}
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
              backgroundColor={theme.colors.WHITE}
              borderWidth={1}
              borderRadius={5}
              borderColor={error ? theme.colors.ERROR : theme.colors.DEFAULT_OFF}
            >
              <StyledText
                fontSize={fieldFontSize}
                color={formattedValue ? theme.colors.TEXT_DARK : theme.colors.TEXT_SOFT}
              >
                {formattedValue || getPlaceholder()}
              </StyledText>
              <StyledView
                marginRight={10}
                height="100%"
                width={screenPercentageToDP(2.4, Orientation.Height)}
              >
                <IconComponent
                  height={screenPercentageToDP(2.4, Orientation.Height)}
                  width={screenPercentageToDP(2.4, Orientation.Height)}
                  fill={theme.colors.PRIMARY_MAIN}
                />
              </StyledView>
            </InputContainer>
          </TouchableWithoutFeedback>
        </StyledView>
        {
          // see: https://github.com/react-native-datetimepicker/datetimepicker/issues/182#issuecomment-643156239
          React.useMemo(
            () => (
              <DatePicker
                onDateChange={onAndroidDateChange}
                mode={mode === 'datetime' ? currentPickerMode : mode}
                isVisible={isDatePickerVisible}
                value={
                  currentPickerMode === 'time' && tempDate ? tempDate : dateValue || new Date()
                }
                min={min}
                max={max}
              />
            ),
            [isDatePickerVisible, currentPickerMode, tempDate],
          )
        }
        {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
      </StyledView>
    );
  },
);
