import React, { useState } from 'react';
import { InputContainer } from './styles';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { TouchableWithoutFeedback } from 'react-native';
import TextFieldLabel from './TextFieldLabel';
import { StyledView, StyledText, RowView } from '../../styled/common';
import { formatDate } from '../../helpers/date';
import theme from '../../styled/theme';
import * as Icons from '../Icons';

export interface TextFieldProps {
  value: Date | null;
  onChange: (date: Date) => void;  
  label?: '' | string;
  placeholder?: '' | string;
  error?: '' | string;
  dateFormat: string;  
}

export const DateTextField = React.memo(
  ({ value, onChange, label, error, dateFormat,  }: TextFieldProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);    
    return (
      <StyledView width={'100%'}>
        <StyledView height="55" width="100%">
          <TouchableWithoutFeedback
            onPress={() => {
              console.log('touchablewithoutfeedback ', showDatePicker);
              setShowDatePicker(true)
            }}>
            <InputContainer
              justifyContent="flex-end"
              hasValue={value !== null}
              error={error}>
              {label && (
                <TextFieldLabel
                  error={error}
                  focus={showDatePicker}
                  onFocus={setShowDatePicker}
                  valueIsEmpty={value !== null}>
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
                    {value && formatDate(value, dateFormat)}
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
          onCancel={() => {
            setShowDatePicker(false);            
          }}
        />
      </StyledView>
    );
  },
);
