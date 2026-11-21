import React, { type ReactElement, type ReactNode } from 'react';
import Modal from 'react-native-modal';

import { UPDATE_STAGE, type UpdateStage } from '~/types/Updater';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Button } from './Button';
import { CrossIcon } from './Icons';
import { TranslatedText } from './Translations/TranslatedText';

interface UpdateModalsProps {
  stage: UpdateStage;
  confirming: boolean;
  onCancelConfirm: () => void;
  onConfirm: () => void;
  onTryAgain: () => void;
  onDismissFailure: () => void;
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
      paddingTop={screenPercentageToDP(onClose ? 3.6 : 7.2, Orientation.Width)}
      paddingLeft={screenPercentageToDP(3.6, Orientation.Width)}
      paddingRight={screenPercentageToDP(3.6, Orientation.Width)}
      paddingBottom={screenPercentageToDP(7.2, Orientation.Width)}
      background={theme.colors.WHITE}
      borderRadius={5}
    >
      {onClose && (
        <StyledView height={screenPercentageToDP(8.3, Orientation.Width)} alignItems="flex-end">
          <StyledTouchableOpacity onPress={onClose}>
            <CrossIcon
              fill={theme.colors.TEXT_SUPER_DARK}
              size={screenPercentageToDP(4.4, Orientation.Width)}
            />
          </StyledTouchableOpacity>
        </StyledView>
      )}
      <StyledText
        fontSize={screenPercentageToDP(4.8, Orientation.Width)}
        fontWeight={600}
        color={theme.colors.TEXT_SUPER_DARK}
        marginBottom={screenPercentageToDP(5.6, Orientation.Width)}
        textAlign="center"
      >
        {title}
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(3.6, Orientation.Width)}
        color={theme.colors.TEXT_SUPER_DARK}
        textAlign="center"
        paddingLeft={screenPercentageToDP(6.7, Orientation.Width)}
        paddingRight={screenPercentageToDP(6.7, Orientation.Width)}
        marginBottom={screenPercentageToDP(3.9, Orientation.Width)}
      >
        {body}
      </StyledText>
      {children}
    </StyledView>
  </Modal>
);

/**
 * The three states installing can be in. Only one is ever visible, and the installing one cannot
 * be dismissed because Android has the package by then and the app is about to close. Rendered once,
 * by UpdateProvider, so screens kept mounted behind the current one never show a second copy.
 */
export const UpdateModals = ({
  stage,
  confirming,
  onCancelConfirm,
  onConfirm,
  onTryAgain,
  onDismissFailure,
}: UpdateModalsProps): ReactElement => {
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
          <StyledView marginTop={screenPercentageToDP(2.8, Orientation.Width)}>
            <Button
              backgroundColor={theme.colors.PRIMARY_MAIN}
              onPress={onConfirm}
              textColor={theme.colors.WHITE}
              width={screenPercentageToDP(64, Orientation.Width)}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              fontWeight={500}
              buttonText={
                <TranslatedText
                  stringId="update.action.installAndClose"
                  fallback="Install and close"
                />
              }
            />
          </StyledView>
          <StyledView marginTop={screenPercentageToDP(2.8, Orientation.Width)}>
            <Button
              outline
              borderColor={theme.colors.PRIMARY_MAIN}
              onPress={onCancelConfirm}
              textColor={theme.colors.PRIMARY_MAIN}
              width={screenPercentageToDP(64, Orientation.Width)}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              fontWeight={500}
              buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
            />
          </StyledView>
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
        onClose={onDismissFailure}
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
          <StyledView marginTop={screenPercentageToDP(2.8, Orientation.Width)}>
            <Button
              backgroundColor={theme.colors.PRIMARY_MAIN}
              onPress={onTryAgain}
              textColor={theme.colors.WHITE}
              width={screenPercentageToDP(64, Orientation.Width)}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              fontWeight={500}
              buttonText={<TranslatedText stringId="update.action.tryAgain" fallback="Try again" />}
            />
          </StyledView>
          <StyledView marginTop={screenPercentageToDP(2.8, Orientation.Width)}>
            <Button
              outline
              borderColor={theme.colors.PRIMARY_MAIN}
              onPress={onDismissFailure}
              textColor={theme.colors.PRIMARY_MAIN}
              width={screenPercentageToDP(64, Orientation.Width)}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              fontWeight={500}
              buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
            />
          </StyledView>
        </StyledView>
      </UpdateModal>
    </>
  );
};
