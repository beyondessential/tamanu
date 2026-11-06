import { useFocusEffect } from '@react-navigation/native';
import React, { type ReactElement, useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { UPDATE_BLOCKER, UPDATE_STAGE } from '~/types/Updater';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useUpdate } from '~/ui/contexts/UpdateContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { downloadProportion } from '~/services/update/updatePolicy';
import { StyledText, StyledTouchableOpacity } from '~/ui/styled/common';
import { Alert, AlertSeverity, SEVERITY_TO_COLORS } from './Alert';
import { TranslatedText } from './Translations/TranslatedText';

const { color: ALERT_COLOUR } = SEVERITY_TO_COLORS[AlertSeverity.Warning];

const AlertText = ({ children }: { children: React.ReactNode }): ReactElement => (
  <StyledText
    color={ALERT_COLOUR}
    fontSize={screenPercentageToDP(1.68, Orientation.Height)}
    // Wraps instead of pushing the action and close button off the banner
    style={{ flexShrink: 1 }}
  >
    {children}
  </StyledText>
);

// Takes a plain string: TranslatedText resets the text decoration, which would drop the underline
const AlertAction = ({
  onPress,
  children,
}: {
  onPress: () => void;
  children: string;
}): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <StyledText
      marginLeft={screenPercentageToDP(1, Orientation.Width)}
      color={ALERT_COLOUR}
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
  const {
    isUpdateOutstanding,
    stage,
    progress,
    blocker,
    manualUrl,
    grantPermission,
    requestInstall,
  } = useUpdate();
  const { getTranslation } = useTranslation();
  const [closed, setClosed] = useState(false);

  // Closing the banner only hides it until staff next arrive at the home screen. The screen stays
  // mounted behind the other tabs, so coming back to it has to clear the dismissal explicitly.
  useFocusEffect(
    useCallback(() => {
      setClosed(false);
    }, []),
  );

  if (!isUpdateOutstanding || closed) return null;

  const proportion = downloadProportion(progress.downloadedBytes, progress.totalBytes);
  const percent = proportion === null ? null : Math.round(proportion * 100);

  const isBlocked = stage === UPDATE_STAGE.BLOCKED;

  return (
    <>
      <Alert open onClose={() => void setClosed(true)} severity={AlertSeverity.Warning}>
        {stage === UPDATE_STAGE.NEEDS_PERMISSION ? (
          <>
            <AlertText>
              <TranslatedText
                stringId="update.alert.needsPermission"
                fallback="Tamanu needs permission to update. Sync paused. You are currently working offline."
              />
            </AlertText>
            <AlertAction onPress={grantPermission}>
              {getTranslation('update.action.allow', 'Allow')}
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
            <AlertAction onPress={() => void requestInstall()}>
              {getTranslation('update.action.install', 'Install')}
            </AlertAction>
          </>
        ) : isBlocked && blocker === UPDATE_BLOCKER.STILL_OUT_OF_DATE ? (
          <AlertText>
            <TranslatedText
              stringId="update.alert.notAccepted"
              fallback="Tamanu update was not accepted by the server. Please contact your system administrator."
            />
          </AlertText>
        ) : isBlocked && blocker === UPDATE_BLOCKER.PACKAGE_UNAVAILABLE ? (
          <AlertText>
            <TranslatedText
              stringId="update.alert.packageUnavailable"
              fallback="No Tamanu update is available for this server. Sync paused. Please contact your system administrator."
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
                {getTranslation('update.action.downloadByHand', 'Download by hand')}
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
                {getTranslation('update.action.downloadByHand', 'Download by hand')}
              </AlertAction>
            )}
          </>
        )}
      </Alert>
    </>
  );
};
