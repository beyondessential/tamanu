import React from 'react';
import posed from 'react-native-pose';
import {
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StyledView, StyledScrollView, StyledText } from '../../styled/common';
import { theme } from '../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { SelectOption } from '.';

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
  items: SelectOption[];
  open: boolean;
  onChange: Function;
  closeModal: Function;
  disabled?: boolean;
}

export const AndroidPicker = React.memo(
  ({ items, open, onChange, closeModal, disabled }: AndroidPickerProps) => {
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
        <TouchableWithoutFeedback onPress={(): void => closeModal()}>
          <StyledView height="100%" width="100%" position="absolute" />
        </TouchableWithoutFeedback>
        <StyledScrollView
          as={AnimatedAndroidCard}
          pose={open ? 'open' : 'closed'}
          position="absolute"
          borderRadius={5}
          height={screenPercentageToDP('24%', Orientation.Height)}
          width="50%"
          zIndex={5}
          background={theme.colors.WHITE}
        >
          <StyledText
            marginLeft={screenPercentageToDP('2.43%', Orientation.Width)}
            marginTop={screenPercentageToDP('1.21%', Orientation.Height)}
            marginBottom={screenPercentageToDP('1.21%', Orientation.Height)}
            color={theme.colors.TEXT_SOFT}
          >
            Pick a Value
          </StyledText>
          {items.map(item => (
            <React.Fragment key={item.label}>
              <TouchableOpacity onPress={(): void => onChangeItem(item)}>
                <StyledView
                  accessibilityLabel={item.label}
                  justifyContent="center"
                  paddingLeft={screenPercentageToDP('3.64%', Orientation.Width)}
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
      </StyledView>
    );
  },
);

export default AndroidPicker;
