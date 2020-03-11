import React, { useState } from 'react';
import { TouchableWithoutFeedback, Platform } from 'react-native';
import { InputContainer } from '../TextField/styles';
import { StyledView, StyledText } from '../../styled/common';
import * as Icons from '../Icons';
import { TextFieldLabel } from '../TextField/TextFieldLabel';
import { theme } from '../../styled/theme';
import { AndroidPicker } from './Picker.android';
import { IOSPicker } from './Picker.ios';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { BaseInputProps } from '../../interfaces/BaseInputProps';

export interface SelectOption {
  label: string;
  value: string;
}

export interface DropdownProps extends BaseInputProps {
  options: SelectOption[];
  onChange: Function;
  value: SelectOption | null;
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
    const closeModal = React.useCallback(() => setOpen(false), []);
    const openModal = React.useCallback(() => (disabled ? null : setOpen(true)), []);

    return (
      <React.Fragment>
        <StyledView height={screenPercentageToDP('6.68', Orientation.Height)} width="100%">
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
                <React.Fragment>
                  <TextFieldLabel
                    onFocus={disabled ? closeModal : setOpen}
                    focus={open}
                    isValueEmpty={value !== null}
                    error={error}
                  >
                    {`${label}${required ? '*' : ''}`}
                  </TextFieldLabel>
                </React.Fragment>
              )}
              <StyledText
                marginTop={screenPercentageToDP(1.80, Orientation.Height)}
                accessibilityLabel={value && value.label ? value.label : ''}
                fontSize={screenPercentageToDP(2.18, Orientation.Height)}
                color={theme.colors.TEXT_DARK}
              >
                {value && value.label ? value.label : ''}
              </StyledText>
              <StyledView marginRight={10} justifyContent="center">
                <Icons.ArrowDown
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
              disabled={disabled}
              closeModal={closeModal}
              items={options}
              onChange={onChange}
              open={open}
            />
          )}
        </StyledView>
      </React.Fragment>
    );
  },
);
