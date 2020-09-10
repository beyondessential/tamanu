import React from 'react';
import styled from 'styled-components/native';
import { Picker, Modal, StyleSheet } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { FullView, StyledView, StyledText, RowView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { SelectOption } from '.';
import { Button } from '../Button';

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
  selectedItem: string;
  closeModal: () => void;
  disabled: boolean;
}

export const IOSPicker = React.memo(
  ({
    items,
    open,
    onChange,
    selectedItem,
    disabled = false,
    closeModal,
  }: PickerPropsIOS) => (
    <Modal animated animationType="slide" visible={open} transparent>
      <FullView background="transparent" justifyContent="flex-end">
        <StyledView height="70%">
          <TouchableWithoutFeedback
            style={iosPickerStyles.background}
            onPress={closeModal}
          />
        </StyledView>
        <StyledView
          background={theme.colors.DEFAULT_OFF}
          height="32%"
          width="100%"
          borderWidth={1}
          borderColor={theme.colors.BOX_OUTLINE}
        >
          <RowView
            height={screenPercentageToDP(4.43, Orientation.Height)}
            justifyContent="flex-end"
            alignItems="center"
            background={theme.colors.BACKGROUND_GREY}
          >
            <Button
              width={screenPercentageToDP(17.03, Orientation.Width)}
              backgroundColor="transparent"
              onPress={closeModal}
            >
              <StyledText
                fontSize={screenPercentageToDP(2.18, Orientation.Height)}
                color={theme.colors.PRIMARY_MAIN}
              >
                OK
              </StyledText>
            </Button>
          </RowView>
          <StyledPicker
            testID="ios-picker"
            enabled={!disabled}
            itemStyle={iosPickerStyles.itemPicker}
            selectedValue={selectedItem || null}
            onValueChange={(value: any): void => {
              onChange(value);
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
