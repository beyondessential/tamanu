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

export interface SelectOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  options: SelectOption[];
  onChange: Function;
  value: SelectOption | null;
  isOpen?: boolean;
  label?: '' | string;
  error?: '' | string;
  disabled?: boolean;
}

function getModalBackground(OS: string, open: boolean): string {
  if (OS === 'ios') return 'rgba(0,0,0,0)';
  return open ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)';
}

export const Dropdown = React.memo(
  ({ value, onChange, error, options, label, disabled = false }: DropdownProps) => {
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
                  >
                    {label}
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
          background={getModalBackground(Platform.OS, open)}
          width="100%"
          zIndex={open ? 3 : -1}
          position="absolute"
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <StyledView flex={1} background="transparent" />
          </TouchableWithoutFeedback>
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
