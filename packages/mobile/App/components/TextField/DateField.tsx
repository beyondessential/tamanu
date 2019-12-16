import React, { useState, useCallback } from 'react';
import { TouchableWithoutFeedback, Platform, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DatePicker from 'react-native-datepicker';
import { InputContainer } from './styles';
import { TextFieldLabel } from './TextFieldLabel';
import { StyledView, StyledText, RowView } from '../../styled/common';
import { formatDate } from '../../helpers/date';
import theme from '../../styled/theme';
import * as Icons from '../Icons';
import { DateFormats } from '../../helpers/constants';

export interface TextFieldProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: '' | string;
  placeholder?: '' | string;
  error?: '' | string;
}

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

export const DateField = React.memo(
  ({ value, onChange, label, error }: TextFieldProps) => {
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const showDatePicker = useCallback(() => setDatePickerVisible(true), []);
    const hideDatePicker = useCallback(() => setDatePickerVisible(false), []);
    const onDateChange = useCallback(
      (date: string) => onChange(new Date(date)),
      [onChange],
    );

    const getDateStr = useCallback((date: Date) => date.toISOString(), []);

    const onDateConfirm = useCallback(
      (date: Date) => {
        setDatePickerVisible(false);
        onChange(date);
      },
      [onChange],
    );

    return (
      <StyledView width="100%">
        <StyledView height="55" width="100%">
          <TouchableWithoutFeedback onPress={showDatePicker}>
            <InputContainer
              justifyContent="flex-end"
              hasValue={value !== null}
              error={error}>
              {label && (
                <TextFieldLabel
                  error={error}
                  focus={isDatePickerVisible}
                  onFocus={showDatePicker}
                  isValueEmpty={value !== null}>
                  {label}
                </TextFieldLabel>
              )}
              <RowView
                paddingLeft={10}
                paddingRight={10}
                alignItems="center"
                justifyContent="space-between"
                height="100%">
                <StyledView
                  height="100%"
                  justifyContent="flex-end"
                  paddingBottom={10}>
                  <StyledText fontSize={18} color={theme.colors.TEXT_DARK}>
                    {value && formatDate(value, DateFormats.DDMMYY)}
                  </StyledText>
                </StyledView>
                <Icons.Calendar
                  fill={error ? theme.colors.ERROR : theme.colors.BOX_OUTLINE}
                />
              </RowView>
            </InputContainer>
          </TouchableWithoutFeedback>
        </StyledView>
        {Platform.OS === 'ios' ? (
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={onDateConfirm}
            onCancel={hideDatePicker}
          />
        ) : (
          <DatePicker
            date={null}
            androidMode="spinner"
            mode="date"
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
