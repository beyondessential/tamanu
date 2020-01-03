import React from 'react';
import styled from 'styled-components/native';
import { Picker } from 'react-native';
import posed from 'react-native-pose';
import { StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { DropdownItem } from '.';

const StyledPicker = styled.Picker`
  height: 100%;
  width: 100%;
`;

const AnimatedView = posed.View({
  open: {
    bottom: 0,
  },
  closed: {
    bottom: '-50%',
  },
});

interface IOSPickerProps {
  items: DropdownItem[];
  open: boolean;
  onChange: Function;
  selectedItem: DropdownItem | null;
  closeModal: () => void;
}

export const IOSPicker = React.memo(
  ({ items, open, onChange, selectedItem }: IOSPickerProps) => (
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
        itemStyle={{
          fontSize: 30,
        }}
        selectedValue={selectedItem ? selectedItem.value : null}
        onValueChange={value => {
          onChange(items.find(item => item.value === value));
        }}
      >
        {items.map((item: DropdownItem) => (
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
