import React, { useState } from 'react';
import Modal from 'react-native-modal';
import { Button } from '~/ui/components/Button';
import { CrossIcon } from '~/ui/components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const RemoveReminderContactModal = ({
  open,
  onClose,
  onRemoveReminderContact,
  children,
}) => {
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
          fontSize={16}
          fontWeight={500}
          color={theme.colors.MAIN_SUPER_DARK}
          marginBottom={10}
          textAlign="center"
        >
          <TranslatedText
            stringId="patient.details.reminderContacts.removeTitle"
            fallback="Would you like to remove the below contact?"
          />
        </StyledText>
        <StyledText color={theme.colors.MAIN_SUPER_DARK} marginBottom={20} textAlign="center">
          <TranslatedText
            stringId="patient.details.reminderContacts.removeDescription"
            fallback="You can add the contact again at any time."
          />
        </StyledText>
        {children}
        <Button
          onPress={onRemove}
          backgroundColor={theme.colors.PRIMARY_MAIN}
          marginTop={20}
          loadingAction={isRemoving}
        >
          <StyledText color={theme.colors.WHITE} fontSize={16} fontWeight={500}>
            <TranslatedText
              stringId="patient.details.reminderContacts.removeContactBtn"
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
        >
          <StyledText color={theme.colors.PRIMARY_MAIN} fontSize={16} fontWeight={500}>
            <TranslatedText
              stringId="patient.details.reminderContacts.cancelBtn"
              fallback="Cancel"
            />
          </StyledText>
        </Button>
      </StyledView>
    </Modal>
  );
};
