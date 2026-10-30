import React, { type ReactElement, useState } from 'react';
import { Linking } from 'react-native';

import { UPDATE_BLOCKER, UPDATE_STAGE } from '~/types/Updater';
import { useUpdate } from '~/ui/contexts/UpdateContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { downloadProportion } from '~/services/update/updatePolicy';
import { StyledText, StyledTouchableOpacity } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Alert, AlertSeverity } from './Alert';
import { TranslatedText } from './Translations/TranslatedText';
import { UpdateModals } from './UpdateModals';

const AlertText = ({ children }: { children: React.ReactNode }): ReactElement => (
  <StyledText
    color={theme.colors.PRIMARY_MAIN}
    fontSize={screenPercentageToDP(1.68, Orientation.Height)}
  >
    {children}
  </StyledText>
);

const AlertAction = ({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <StyledText
      marginLeft={screenPercentageToDP(1, Orientation.Width)}
      color={theme.colors.PRIMARY_MAIN}
      textDecorationLine="underline"
      fontSize={screenPercentageToDP(1.68, Orientation.Height)}
    >
      {children}
    </StyledText>
  </StyledTouchableOpacity>
);

/**
 * The home screen banner carrying an outstanding update. Staff keep working while it sits there;
 * closing it only hides it until they next arrive at the home screen, because the screen remounts.
 */
export const UpdateAlert = (): ReactElement | null => {
  const { isUpdateOutstanding, stage, progress, blocker, manualUrl, install, grantPermission } =
    useUpdate();
  const [closed, setClosed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!isUpdateOutstanding || closed) return null;

  const proportion = downloadProportion(progress.downloadedBytes, progress.totalBytes);
  const percent = proportion === null ? null : Math.round(proportion * 100);

  const isBlocked = stage === UPDATE_STAGE.BLOCKED;
  const severity = isBlocked ? AlertSeverity.Warning : AlertSeverity.Info;

  return (
    <>
      <Alert open onClose={() => void setClosed(true)} severity={severity}>
        {stage === UPDATE_STAGE.NEEDS_PERMISSION ? (
          <>
            <AlertText>
              <TranslatedText
                stringId="update.alert.needsPermission"
                fallback="Tamanu needs permission to update. Sync paused. You are currently working offline."
              />
            </AlertText>
            <AlertAction onPress={grantPermission}>
              <TranslatedText stringId="update.action.allow" fallback="Allow" />
            </AlertAction>
          </>
        ) : stage === UPDATE_STAGE.READY || stage === UPDATE_STAGE.INSTALL_FAILED ? (
          <>
            <AlertText>
              <TranslatedText
                stringId="update.alert.ready"
                fallback="Tamanu update ready. Install to sync."
              />
            </AlertText>
            <AlertAction onPress={() => void setConfirming(true)}>
              <TranslatedText stringId="update.action.install" fallback="Install" />
            </AlertAction>
          </>
        ) : isBlocked && blocker === UPDATE_BLOCKER.STILL_OUT_OF_DATE ? (
          <AlertText>
            <TranslatedText
              stringId="update.alert.notAccepted"
              fallback="Tamanu update was not accepted by the server. Please contact your system administrator."
            />
          </AlertText>
        ) : isBlocked && blocker === UPDATE_BLOCKER.NOT_ENOUGH_SPACE ? (
          <>
            <AlertText>
              <TranslatedText
                stringId="update.alert.notEnoughSpace"
                fallback="Not enough space to update Tamanu. Sync paused."
              />
            </AlertText>
            {manualUrl && (
              <AlertAction onPress={() => void Linking.openURL(manualUrl)}>
                <TranslatedText
                  stringId="update.action.downloadByHand"
                  fallback="Download by hand"
                />
              </AlertAction>
            )}
          </>
        ) : (
          <>
            <AlertText>
              {percent === null ? (
                <TranslatedText
                  stringId="update.alert.downloading"
                  fallback="Downloading a Tamanu update. Sync paused."
                />
              ) : (
                <TranslatedText
                  stringId="update.alert.downloadingWithProgress"
                  fallback="Downloading a Tamanu update (:percent%). Sync paused."
                  replacements={{ percent }}
                />
              )}
            </AlertText>
            {manualUrl && (
              <AlertAction onPress={() => void Linking.openURL(manualUrl)}>
                <TranslatedText
                  stringId="update.action.downloadByHand"
                  fallback="Download by hand"
                />
              </AlertAction>
            )}
          </>
        )}
      </Alert>
      <UpdateModals
        confirming={confirming}
        onCancelConfirm={() => void setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          install();
        }}
      />
    </>
  );
};
