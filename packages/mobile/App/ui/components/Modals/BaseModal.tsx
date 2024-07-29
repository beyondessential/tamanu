import React, { ReactNode } from 'react';
import Modal from 'react-native-modal';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { CrossIcon } from '../Icons';
import { TranslatedTextElement } from '~/ui/components/Translations/TranslatedText';

export interface BaseModalProps {
  open: boolean;
  onClose: (() => void) | (() => Promise<void>);
  title: TranslatedTextElement;
  children: ReactNode;
}

export const BaseModal = ({ open, onClose, title, children }: BaseModalProps): JSX.Element => {
  return (
    <Modal isVisible={open} onBackdropPress={onClose}>
      <StyledView
        background={theme.colors.WHITE}
        padding={screenPercentageToDP(5.4, Orientation.Width)}
        paddingBottom={34}
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
        <StyledText
          fontSize={16}
          fontWeight={500}
          color={theme.colors.TEXT_SUPER_DARK}
          textAlign="center"
        >
          {title}
        </StyledText>
        {children}
      </StyledView>
    </Modal>
  );
};
