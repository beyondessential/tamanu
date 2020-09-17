import React, { useState, useMemo, useCallback } from 'react';
import { TouchableWithoutFeedback, Platform } from 'react-native';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { InputContainer } from '../TextField/styles';
import * as Icons from '../Icons';
import { TextFieldLabel } from '../TextField/TextFieldLabel';
import { AndroidPicker } from './Picker.android';
import { IOSPicker } from './Picker.ios';

export interface SelectOption {
  label: string;
  value: string;
}

export interface DropdownProps extends BaseInputProps {
  options: SelectOption[];
  onChange: Function;
  value?: string;
  isOpen?: boolean;
  disabled?: boolean;
}
export const Dropdown = React.memo(
  ({
    value,
    onChange,
    error,
    options,
    label,
    disabled = false,
    required = false,
  }: DropdownProps) => {
    const [open, setOpen] = useState(false);
    const closeModal = useCallback(() => setOpen(false), []);
    const openModal = useCallback(() => (disabled ? null : setOpen(true)), []);
    const selectedOption = useMemo(
      () => options.find(option => option.value === value),
      [value],
    );
    return (
      <>
        <StyledView
          height={screenPercentageToDP('6.68', Orientation.Height)}
          width="100%"
        >
          <TouchableWithoutFeedback onPress={openModal}>
            <InputContainer
              disabled={disabled}
              flexDirection="row"
              hasValue={value !== null}
              error={error}
              justifyContent="space-between"
              paddingLeft={screenPercentageToDP(2.82, Orientation.Width)}
              alignItems="center"
            >
              {label && (
                <>
                  <TextFieldLabel
                    onFocus={disabled ? closeModal : setOpen}
                    focus={open}
                    isValueEmpty={value !== null}
                    error={error}
                  >
                    {`${label}${required ? '*' : ''}`}
                  </TextFieldLabel>
                </>
              )}
              <StyledText
                marginTop={screenPercentageToDP(1.8, Orientation.Height)}
                accessibilityLabel={
                  value && selectedOption ? selectedOption.label : ''
                }
                fontSize={screenPercentageToDP(2.18, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
              >
                {selectedOption ? selectedOption.label : ''}
              </StyledText>
              <StyledView marginRight={10} justifyContent="center">
                <Icons.ArrowDownIcon
                  fill={theme.colors.TEXT_SOFT}
                  width={screenPercentageToDP(2.84, Orientation.Width)}
                />
              </StyledView>
            </InputContainer>
          </TouchableWithoutFeedback>
        </StyledView>
        <StyledView
          height="100%"
          background="transparent"
          width="100%"
          zIndex={open ? 3 : -1}
          position="absolute"
        >
          {Platform.OS === 'ios' ? (
            <IOSPicker
              disabled={disabled}
              onChange={onChange}
              closeModal={closeModal}
              items={options}
              open={open}
              selectedItem={value}
            />
          ) : (
              <AndroidPicker
                closeModal={closeModal}
                items={options}
                onChange={onChange}
                open={open}
              />
            )}
        </StyledView>
      </>
    );
  },
);
