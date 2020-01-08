import React, { useState } from 'react';
import { TouchableWithoutFeedback, Platform } from 'react-native';
import { InputContainer } from '../TextField/styles';
import { StyledView, StyledText } from '../../styled/common';
import * as Icons from '../Icons';
import { TextFieldLabel } from '../TextField/TextFieldLabel';
import { theme } from '../../styled/theme';
import { AndroidPicker } from './Picker.android';
import { IOSPicker } from './Picker.ios';

export interface DropdownItem {
  label: string;
  value: string;
}

export interface DropdownProps {
  items: DropdownItem[];
  onChange: Function;
  value: DropdownItem | null;
  isOpen?: boolean;
  label?: '' | string;
  error?: '' | string;
}

function getModalBackground(OS: string, open: boolean): string {
  if (OS === 'ios') return 'rgba(0,0,0,0)';
  return open ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)';
}

export const Dropdown = React.memo(
  ({ value, onChange, error, items, label }: DropdownProps) => {
    const [open, setOpen] = useState(false);
    const closeModal = React.useCallback(() => setOpen(false), []);
    const openModal = React.useCallback(() => setOpen(true), []);

    return (
      <React.Fragment>
        <StyledView height={55} width="100%">
          <TouchableWithoutFeedback onPress={openModal}>
            <InputContainer
              flexDirection="row"
              hasValue={value !== null}
              error={error}
              justifyContent="space-between"
              alignItems="center"
            >
              {label && (
                <React.Fragment>
                  <TextFieldLabel
                    onFocus={setOpen}
                    focus={open}
                    isValueEmpty={value !== null}
                  >
                    {label}
                  </TextFieldLabel>
                </React.Fragment>
              )}
              <StyledText
                accessibilityLabel={value && value.label ? value.label : ''}
                fontSize={18}
                color={theme.colors.TEXT_DARK}
                marginTop={10}
                marginLeft={10}
              >
                {value && value.label ? value.label : ''}
              </StyledText>
              <StyledView marginRight={10}>
                <Icons.ArrowDown height={20} />
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
              onChange={onChange}
              closeModal={closeModal}
              items={items}
              open={open}
              selectedItem={value}
            />
          ) : (
            <AndroidPicker
              closeModal={closeModal}
              items={items}
              onChange={onChange}
              open={open}
            />
          )}
        </StyledView>
      </React.Fragment>
    );
  },
);
