import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { TouchableWithoutFeedback } from 'react-native';
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

export const DateField = React.memo(
  ({ value, onChange, label, error }: TextFieldProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    return (
      <StyledView width="100%">
        <StyledView height="55" width="100%">
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(true)}>
            <InputContainer
              justifyContent="flex-end"
              hasValue={value !== null}
              error={error}>
              {label && (
                <TextFieldLabel
                  error={error}
                  focus={showDatePicker}
                  onFocus={setShowDatePicker}
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
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={(date: Date) => {
            setShowDatePicker(false);
            onChange(date);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      </StyledView>
    );
  },
);
