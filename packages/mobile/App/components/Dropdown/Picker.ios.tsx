import React from 'react';
import styled from 'styled-components/native';
import { Picker, StyleSheet } from 'react-native';
import posed from 'react-native-pose';
import { StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { SelectOption } from '.';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

const StyledPicker = styled.Picker`
  height: 100%;
  width: 100%;
`;

const AnimatedView = posed.View({
  open: {
    opacity: 1,
    y: screenPercentageToDP(70, Orientation.Height),
    transition: {
      opacity: { ease: 'easeOut', duration: 150 },
      default: { ease: 'linear', duration: 150 },
    },
  },
  closed: {
    y: screenPercentageToDP(100, Orientation.Height),
    opacity: 0,
  },
});

interface PickerPropsIOS {
  items: SelectOption[];
  open: boolean;
  onChange: Function;
  selectedItem: SelectOption | null;
  closeModal: () => void;
  disabled?: boolean;
}

const iosPickerStyles = StyleSheet.create({
  itemPicker: {
    fontSize: screenPercentageToDP('3.64%', Orientation.Height),
  },
});

export const IOSPicker = React.memo(
  ({ items, open, onChange, selectedItem, disabled }: PickerPropsIOS) => (
    <StyledView
      as={AnimatedView}
      pose={open ? 'open' : 'closed'}
      position="absolute"
      background={theme.colors.DEFAULT_OFF}
      width="100%"
      height="30%"
      borderWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      zIndex={1}
    >
      <StyledPicker
        testID="ios-picker"
        enabled={!disabled}
        itemStyle={iosPickerStyles.itemPicker}
        selectedValue={selectedItem ? selectedItem.value : null}
        onValueChange={(value): void => {
          onChange(items.find(item => item.value === value));
        }}
      >
        {items.map((item: SelectOption) => (
          <Picker.Item
            testID={item.value}
            color={theme.colors.TEXT_DARK}
            key={item.value}
            {...item}
          />
        ))}
      </StyledPicker>
    </StyledView>
  ),
);
