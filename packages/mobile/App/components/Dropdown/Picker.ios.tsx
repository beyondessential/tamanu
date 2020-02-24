import React from 'react';
import styled from 'styled-components/native';
import { Picker, Modal, StyleSheet } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { FullView, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { SelectOption } from '.';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

const StyledPicker = styled.Picker`
  height: 100%;
  width: 100%;
`;

const iosPickerStyles = StyleSheet.create({
  itemPicker: {
    fontSize: screenPercentageToDP('3.64%', Orientation.Height),
  },
  background: {
    height: '100%',
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


export const IOSPicker = React.memo(
  ({ items, open, onChange, selectedItem, disabled, closeModal }: PickerPropsIOS) => (
    <Modal
      animated
      animationType="slide"
      visible={open}
      transparent
    >
      <FullView
        background="transparent"
        justifyContent="flex-end"
      >
        <StyledView height="70%">
          <TouchableWithoutFeedback style={iosPickerStyles.background} onPress={closeModal} />
        </StyledView>
        <StyledView
          background={theme.colors.DEFAULT_OFF}
          height="30%"
          width="100%"
          borderWidth={1}
          borderColor={theme.colors.BOX_OUTLINE}
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
      </FullView>
    </Modal>
  ),
);
