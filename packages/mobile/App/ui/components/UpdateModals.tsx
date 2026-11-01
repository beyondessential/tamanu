import React, { type ReactElement, type ReactNode } from 'react';
import Modal from 'react-native-modal';

import { UPDATE_STAGE } from '~/types/Updater';
import { useUpdate } from '~/ui/contexts/UpdateContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Button } from './Button';
import { CrossIcon } from './Icons';
import { TranslatedText } from './Translations/TranslatedText';

interface UpdateModalsProps {
  confirming: boolean;
  onCancelConfirm: () => void;
  onConfirm: () => void;
}

interface UpdateModalProps {
  isVisible: boolean;
  /** Omitted while Android has the package, when there is nothing useful left to dismiss. */
  onClose?: () => void;
  title: ReactNode;
  body: ReactNode;
  children?: ReactNode;
}

const UpdateModal = ({
  isVisible,
  onClose,
  title,
  body,
  children,
}: UpdateModalProps): ReactElement => (
  <Modal isVisible={isVisible} onBackdropPress={onClose}>
    <StyledView
      padding={screenPercentageToDP(3.6, Orientation.Width)}
      background={theme.colors.WHITE}
      borderRadius={5}
    >
      <StyledView height={screenPercentageToDP(3, Orientation.Height)}>
        {onClose && (
          <StyledView position="absolute" right={0}>
            <StyledTouchableOpacity onPress={onClose}>
              <CrossIcon
                fill={theme.colors.TEXT_SUPER_DARK}
                size={screenPercentageToDP(2.9, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </StyledView>
        )}
      </StyledView>
      <StyledText
        fontSize={screenPercentageToDP(4.8, Orientation.Width)}
        fontWeight={600}
        color={theme.colors.TEXT_SUPER_DARK}
        marginBottom={screenPercentageToDP(2, Orientation.Height)}
        textAlign="center"
      >
        {title}
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(3.6, Orientation.Width)}
        color={theme.colors.TEXT_SUPER_DARK}
        textAlign="center"
        paddingLeft={screenPercentageToDP(6, Orientation.Width)}
        paddingRight={screenPercentageToDP(6, Orientation.Width)}
        marginBottom={screenPercentageToDP(3.2, Orientation.Height)}
      >
        {body}
      </StyledText>
      {children}
    </StyledView>
  </Modal>
);

/**
 * The three states installing can be in. Only one is ever visible, and the installing one cannot
 * be dismissed because Android has the package by then and the app is about to close.
 */
export const UpdateModals = ({
  confirming,
  onCancelConfirm,
  onConfirm,
}: UpdateModalsProps): ReactElement => {
  const { stage, install, dismissInstallFailure } = useUpdate();

  return (
    <>
      <UpdateModal
        isVisible={confirming && stage !== UPDATE_STAGE.INSTALLING}
        onClose={onCancelConfirm}
        title={<TranslatedText stringId="update.modal.confirm.title" fallback="Install update" />}
        body={
          <TranslatedText
            stringId="update.modal.confirm.body"
            fallback="Save your work first. Tamanu will close to install the update. Open it again from the app icon."
          />
        }
      >
        <StyledView alignItems="center">
          <Button
            backgroundColor={theme.colors.PRIMARY_MAIN}
            onPress={onConfirm}
            textColor={theme.colors.WHITE}
            width={screenPercentageToDP(60, Orientation.Width)}
            fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            fontWeight={500}
            buttonText={
              <TranslatedText
                stringId="update.action.installAndClose"
                fallback="Install and close"
              />
            }
          />
          <Button
            marginTop={screenPercentageToDP(1.5, Orientation.Height)}
            outline
            borderColor={theme.colors.PRIMARY_MAIN}
            onPress={onCancelConfirm}
            textColor={theme.colors.PRIMARY_MAIN}
            width={screenPercentageToDP(60, Orientation.Width)}
            fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            fontWeight={500}
            buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          />
        </StyledView>
      </UpdateModal>

      <UpdateModal
        isVisible={stage === UPDATE_STAGE.INSTALLING}
        title={
          <TranslatedText stringId="update.modal.installing.title" fallback="Installing update" />
        }
        body={
          <TranslatedText
            stringId="update.modal.installing.body"
            fallback="Tamanu will close in a moment. Open it again from the app icon."
          />
        }
      />

      <UpdateModal
        isVisible={stage === UPDATE_STAGE.INSTALL_FAILED}
        onClose={dismissInstallFailure}
        title={
          <TranslatedText stringId="update.modal.failed.title" fallback="Update not installed" />
        }
        body={
          <TranslatedText
            stringId="update.modal.failed.body"
            fallback="The update couldn't be installed. Your work is unaffected."
          />
        }
      >
        <StyledView alignItems="center">
          <Button
            backgroundColor={theme.colors.PRIMARY_MAIN}
            onPress={() => void install()}
            textColor={theme.colors.WHITE}
            width={screenPercentageToDP(60, Orientation.Width)}
            fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            fontWeight={500}
            buttonText={<TranslatedText stringId="update.action.tryAgain" fallback="Try again" />}
          />
          <Button
            marginTop={screenPercentageToDP(1.5, Orientation.Height)}
            outline
            borderColor={theme.colors.PRIMARY_MAIN}
            onPress={dismissInstallFailure}
            textColor={theme.colors.PRIMARY_MAIN}
            width={screenPercentageToDP(60, Orientation.Width)}
            fontSize={screenPercentageToDP(1.94, Orientation.Height)}
            fontWeight={500}
            buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          />
        </StyledView>
      </UpdateModal>
    </>
  );
};
