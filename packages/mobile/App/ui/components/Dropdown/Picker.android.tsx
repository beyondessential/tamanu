import React, { ReactElement } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  FullView,
  StyledScrollView,
  StyledText,
  StyledView,
} from '../../styled/common';
import { theme } from '../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import { SelectOption } from './';

interface AndroidPickerProps {
  options: SelectOption[];
  open: boolean;
  onChange: (option: SelectOption) => void;
  closeModal: () => void;
  label?: string;
}

export const AndroidPicker = ({
  options,
  open,
  onChange,
  closeModal,
  label = 'Pick a value',
}: AndroidPickerProps): ReactElement => {
  const onChangeItem = React.useCallback(
    (item) => {
      onChange(item);
      closeModal();
    },
    [closeModal, onChange],
  );

  return (
    <Modal transparent visible={open} animationType="fade">
      <FullView justifyContent="center" alignItems="center">
        <TouchableWithoutFeedback onPress={closeModal}>
          <StyledView height="100%" width="100%" background="rgba(0,0,0,0.4)" />
        </TouchableWithoutFeedback>
        <StyledScrollView
          position="absolute"
          borderRadius={5}
          width="90%"
          height="100%" // height 100% is needed to make the view scrollable
          zIndex={5}
          background={theme.colors.WHITE}
        >
          <StyledText
            marginLeft={screenPercentageToDP('2.43%', Orientation.Width)}
            marginTop={screenPercentageToDP('1.21%', Orientation.Height)}
            marginBottom={screenPercentageToDP('1.21%', Orientation.Height)}
            color={theme.colors.TEXT_SOFT}
          >
            {options.length > 0 ? label : 'No options available'}
          </StyledText>
          {options.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                onPress={(): void => onChangeItem(item)}
                style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}
              >
                <StyledView
                  accessibilityLabel={item.label}
                  justifyContent="center"
                  paddingLeft="25"
                  paddingRight="25"
                  width="100%"
                  height={screenPercentageToDP('4.86%', Orientation.Height)}
                >
                  <StyledText color={theme.colors.TEXT_DARK}>{item.label}</StyledText>
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
};
