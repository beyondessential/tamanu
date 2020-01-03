import React from 'react';
import posed from 'react-native-pose';
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { DropdownItem } from './index';
import { StyledView, StyledScrollView, StyledText } from '../../styled/common';
import { theme } from '../../styled/theme';

const AnimatedAndroidBackground = posed.View({
  open: {
    opacity: 1,
  },
  closed: {
    opacity: 0,
  },
});

const AnimatedAndroidCard = posed.ScrollView({
  open: {
    bottom: '35%',
  },
  closed: {
    bottom: '-50%',
  },
});
interface AndroidPickerProps {
  items: DropdownItem[];
  open: boolean;
  onChange: Function;
  closeModal: Function;
}

export const AndroidPicker = React.memo(
  ({ items, open, onChange, closeModal }: AndroidPickerProps) => {
    const onChangeItem = React.useCallback(
      item => {
        onChange(item);
        closeModal();
      },
      [closeModal, onChange],
    );

    return (
      <StyledView
        as={AnimatedAndroidBackground}
        pose={open ? 'open' : 'closed'}
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <TouchableWithoutFeedback onPress={() => closeModal()}>
          <StyledView height="100%" width="100%" position="absolute" />
        </TouchableWithoutFeedback>
        <StyledScrollView
          as={AnimatedAndroidCard}
          pose={open ? 'open' : 'closed'}
          position="absolute"
          borderRadius={5}
          height={200}
          width="50%"
          zIndex={5}
          background={theme.colors.WHITE}
        >
          <StyledText
            marginLeft={10}
            marginTop={10}
            marginBottom={10}
            color={theme.colors.TEXT_SOFT}
          >
            Pick a Value
          </StyledText>
          {items.map(item => (
            <React.Fragment key={item.label}>
              <TouchableOpacity onPress={() => onChangeItem(item)}>
                <StyledView
                  accessibilityLabel={item.label}
                  justifyContent="center"
                  paddingLeft={15}
                  height={40}
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
      </StyledView>
    );
  },
);

export default AndroidPicker;
