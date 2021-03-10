import React from 'react';
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import {
  FullView,
  StyledView,
  StyledScrollView,
  StyledText,
} from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { SelectOption } from '.';

interface AndroidPickerProps {
  items: SelectOption[];
  open: boolean;
  onChange: Function;
  closeModal: () => void;
}

export const AndroidPicker = React.memo(
  ({ items, open, onChange, closeModal }: AndroidPickerProps) => {
    const onChangeItem = React.useCallback(
      item => {
        onChange(item.value);
        closeModal();
      },
      [closeModal, onChange],
    );

    return (
      <Modal transparent visible={open} animationType="fade">
        <FullView justifyContent="center" alignItems="center">
          <TouchableWithoutFeedback
            onPress={closeModal}
          >
            <StyledView
              height="100%"
              width="100%"
              background="rgba(0,0,0,0.4)"
            />
          </TouchableWithoutFeedback>
          <StyledScrollView
            position="absolute"
            borderRadius={5}
            width="90%"
            zIndex={5}
            background={theme.colors.WHITE}
          >
            <StyledText
              marginLeft={screenPercentageToDP('2.43%', Orientation.Width)}
              marginTop={screenPercentageToDP('1.21%', Orientation.Height)}
              marginBottom={screenPercentageToDP('1.21%', Orientation.Height)}
              color={theme.colors.TEXT_SOFT}
            >
              {items.length > 0 ? 'Pick a value' : 'No options available'}
            </StyledText>
            {items.map((item, i) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  onPress={(): void => onChangeItem(item)}
                  style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}
                >
                  <StyledView
                    accessibilityLabel={item.label}
                    justifyContent="center"
                    padding={25}
                    height={screenPercentageToDP('4.86%', Orientation.Height)}
                    width="100%"
                  >
                    <StyledText>{item.label}</StyledText>
                  </StyledView>
                </TouchableOpacity>
                <StyledView
                  height={StyleSheet.hairlineWidth}
                  background={theme.colors.TEXT_SOFT}
                  width="100%"
                />
              </React.Fragment>
            ))}
          </StyledScrollView>
        </FullView>
      </Modal>
    );
  },
);

export default AndroidPicker;
