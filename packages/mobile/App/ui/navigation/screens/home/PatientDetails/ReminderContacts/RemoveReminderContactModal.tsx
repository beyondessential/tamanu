import React, { ReactNode, useState } from 'react';
import Modal from 'react-native-modal';
import { Button } from '~/ui/components/Button';
import { CrossIcon } from '~/ui/components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

interface IRemoveReminderContactModal {
  open: boolean;
  onClose: () => void;
  onRemoveReminderContact: () => void;
  children?: ReactNode;
}

export const RemoveReminderContactModal = ({
  open,
  onClose,
  onRemoveReminderContact,
  children,
}: IRemoveReminderContactModal) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const onRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemoveReminderContact();
      onClose();
    } catch (e) {
      console.error('Delete contact failed: ', e);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Modal isVisible={open} onBackdropPress={onClose}>
      <StyledView
        background={theme.colors.WHITE}
        padding={screenPercentageToDP(5.6, Orientation.Width)}
        borderRadius={5}
      >
        <StyledView borderRadius={5}>
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
          fontSize={screenPercentageToDP(2, Orientation.Height)}
          fontWeight={500}
          color={theme.colors.TEXT_SUPER_DARK}
          marginBottom={10}
          textAlign="center"
        >
          <TranslatedText
            stringId="patient.details.removeReminderContact.confirmation"
            fallback="Would you like to remove the below contact?"
          />
        </StyledText>
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          marginBottom={20}
          textAlign="center"
          fontSize={screenPercentageToDP(2, Orientation.Height)}
        >
          <TranslatedText
            stringId="patient.details.removeReminderContact.description"
            fallback="You can add the contact again at any time."
          />
        </StyledText>
        {children}
        <Button
          onPress={onRemove}
          backgroundColor={theme.colors.PRIMARY_MAIN}
          marginTop={20}
          loadingAction={isRemoving}
          height={screenPercentageToDP(5, Orientation.Height)}
        >
          <StyledText
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(2, Orientation.Height)}
            fontWeight={500}
          >
            <TranslatedText
              stringId="patient.details.removeReminderContact.action.remove"
              fallback="Remove contact"
            />
          </StyledText>
        </Button>
        <Button
          onPress={() => onClose()}
          backgroundColor={theme.colors.WHITE}
          borderColor={theme.colors.PRIMARY_MAIN}
          borderWidth={1}
          marginTop={8}
          height={screenPercentageToDP(5, Orientation.Height)}
        >
          <StyledText
            color={theme.colors.PRIMARY_MAIN}
            fontSize={screenPercentageToDP(2, Orientation.Height)}
            fontWeight={500}
          >
            <TranslatedText
              stringId="patient.details.removeReminderContact.action.cancel"
              fallback="Cancel"
            />
          </StyledText>
        </Button>
      </StyledView>
    </Modal>
  );
};
