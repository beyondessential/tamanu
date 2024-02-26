import React from 'react';
import Modal from 'react-native-modal';
import { Button } from '~/ui/components/Button';
import { CrossIcon } from '~/ui/components/Icons';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const RemoveContactModal = ({ open, onClose, children }) => {
  return (
    <Modal isVisible={open} onBackdropPress={onClose}>
      <StyledView
        background={theme.colors.WHITE}
        padding={screenPercentageToDP(5.6, Orientation.Width)}
      >
        <StyledView
          padding={screenPercentageToDP(3.6, Orientation.Width)}
          paddingBottom={screenPercentageToDP(1.6, Orientation.Height)}
          paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
          borderRadius={5}
        >
          <StyledView height={screenPercentageToDP(4, Orientation.Height)}>
            <StyledView position="absolute" right={0}>
              <StyledTouchableOpacity onPress={onClose}>
                <CrossIcon
                  fill={theme.colors.TEXT_SUPER_DARK}
                  size={screenPercentageToDP(1.9, Orientation.Height)}
                />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>

        <StyledText
          fontSize={18}
          fontWeight={600}
          color={theme.colors.MAIN_SUPER_DARK}
          marginBottom={10}
        >
          Would you like to remove the below contact?
        </StyledText>
        <StyledText color={theme.colors.MAIN_SUPER_DARK} marginBottom={20}>
          You can add the contact again at any time.
        </StyledText>
        {children}
        <Button onPress={() => {}} backgroundColor={theme.colors.PRIMARY_MAIN} marginTop={20}>
          <StyledText color={theme.colors.WHITE} fontSize={16} fontWeight={600}>
            Remove contact
          </StyledText>
        </Button>
        <Button
          onPress={() => onClose()}
          backgroundColor={theme.colors.WHITE}
          borderColor={theme.colors.PRIMARY_MAIN}
          borderWidth={1}
          marginTop={10}
        >
          <StyledText color={theme.colors.PRIMARY_MAIN} fontSize={16} fontWeight={600}>
            Cancel
          </StyledText>
        </Button>
      </StyledView>
    </Modal>
  );
};
