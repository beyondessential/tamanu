import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { Button } from '../Button';
import { TranslatedText, TranslatedTextElement } from '~/ui/components/Translations/TranslatedText';
import { BaseModal, BaseModalProps } from './BaseModal';

export interface ConfirmModalProps extends BaseModalProps {
  confirmButtonText: TranslatedTextElement;
  onConfirm: (() => void) | (() => Promise<void>);
  showCancelButton?: boolean;
}

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  confirmButtonText,
  showCancelButton = true,
  children,
}: ConfirmModalProps): JSX.Element => {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
    >
      {children}
      <Button
        onPress={onConfirm}
        height={screenPercentageToDP(5, Orientation.Height)}
        marginTop={14}
        backgroundColor={theme.colors.PRIMARY_MAIN}
        textColor={theme.colors.WHITE}
        fontSize={16}
        fontWeight={500}
        buttonText={confirmButtonText}
      />
      {showCancelButton && (
        <Button
          onPress={onClose}
          height={screenPercentageToDP(5, Orientation.Height)}
          marginTop={8}
          backgroundColor={theme.colors.WHITE}
          borderColor={theme.colors.PRIMARY_MAIN}
          textColor={theme.colors.PRIMARY_MAIN}
          borderWidth={1}
          fontSize={16}
          fontWeight={500}
          buttonText={<TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
          />}
        />
      )}
    </BaseModal>
  );
};
