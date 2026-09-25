import DateTimePicker from '@react-native-community/datetimepicker';
import { parseISO } from 'date-fns';
import React, { type ReactElement, useCallback, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useDateFormatter } from '~/ui/hooks/useDateFormatter';
import type { BaseInputProps } from '../../interfaces/BaseInputProps';
import { CalendarIcon, ClockIcon } from '../Icons';
import { RequiredIndicator } from '../RequiredIndicator';
import { InputContainer } from '../TextField/styles';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { DateFormats } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

// Spinner mode ignores colorAccent from styles.xml — set button colours explicitly.
// See https://github.com/react-native-datetimepicker/datetimepicker/issues/543
const pickerButtonProps = { textColor: '#326699' } as const;

/**
 * Android snaps back to epoch when given `maximumDate` without `minimumDate`. Fall back to earliest
 * date supported by platform picker.
 * @see https://github.com/react-native-datetimepicker/datetimepicker/issues/935
 */
const EARLIEST_SUPPORTED_DATE = new Date(1900, 0, 1);

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

  const minimumDate = min ?? (max && mode !== 'time' ? EARLIEST_SUPPORTED_DATE : undefined);

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display="spinner"
      onChange={onDateChange}
      style={styles.androidPickerStyles}
      maximumDate={max}
      minimumDate={minimumDate}
      positiveButton={pickerButtonProps}
      negativeButton={pickerButtonProps}
    />
  );
};

export interface DateFieldProps extends BaseInputProps {
  value: Date | string;
  onChange: (date: Date) => void;
  placeholder?: '' | string;
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean;
  min?: Date;
  max?: Date;
  labelFontSize?: number | string;
  fieldFontSize?: number | string;
  labelColor?: string;
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
    const { formatDate } = useDateFormatter();
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [currentPickerMode, setCurrentPickerMode] = useState<'date' | 'time'>('date');
    const [tempDate, setTempDate] = useState<Date | null>(null);

    const showDatePicker = () => {
      setDatePickerVisible(true);
      setCurrentPickerMode(mode === 'datetime' ? 'date' : mode);
    };

    const onAndroidDateChange = useCallback(
      (_event, selectedDate) => {
        if (!selectedDate) {
          setDatePickerVisible(false);
          setTempDate(null);
          return;
        }

        if (mode === 'datetime') {
          if (currentPickerMode === 'date') {
            // Store the selected date and switch to time picker
            setTempDate(selectedDate);
            setCurrentPickerMode('time');
            setDatePickerVisible(true);
            return;
          } else {
            // Combine the stored date with the selected time
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
      },
      [onChange, mode, currentPickerMode, tempDate],
    );

    const IconComponent = mode === 'time' ? ClockIcon : CalendarIcon;

    const dateValue = value && (value instanceof Date ? value : parseISO(value));
    const formattedValue = (() => {
      if (!value) return null;
      switch (mode) {
        case 'date':
          return formatDate(dateValue, DateFormats.DDMMYY);
        case 'time':
          return formatDate(dateValue, DateFormats.TIME);
        case 'datetime':
          return `${formatDate(dateValue, DateFormats.DDMMYY)} ${formatDate(dateValue, DateFormats.TIME)}`;
      }
    })();

    const getPlaceholder = () => {
      if (placeholder) return placeholder;
      if (mode === 'datetime') return 'dd/mm/yyyy hh:mm';
      if (mode === 'time') return 'hh:mm';
      return 'dd/mm/yyyy';
    };

    return (
      <StyledView marginBottom={screenPercentageToDP(2.24, Orientation.Height)} width="100%">
        {label && (
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
        <DatePicker
          onDateChange={onAndroidDateChange}
          mode={mode === 'datetime' ? currentPickerMode : mode}
          isVisible={isDatePickerVisible}
          value={currentPickerMode === 'time' && tempDate ? tempDate : dateValue || new Date()}
          min={min}
          max={max}
        />
        {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
      </StyledView>
    );
  },
);
