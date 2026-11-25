import React, { type ReactElement } from 'react';

import { UPDATE_BLOCKER, UPDATE_STAGE, type UpdateBlocker } from '~/types/Updater';
import { useUpdate } from '~/ui/contexts/UpdateContext';
import { downloadProportion } from '~/services/update/updatePolicy';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Button } from './Button';
import { PauseIcon } from './Icons';
import { TranslatedText } from './Translations/TranslatedText';

// The banner's blocked messages, so staff who closed it still learn why the update has stopped
const blockedReasonFor = (blocker: UpdateBlocker | null): ReactElement | null => {
  switch (blocker) {
    case UPDATE_BLOCKER.STILL_OUT_OF_DATE:
      return (
        <TranslatedText
          stringId="sync.paused.notAccepted"
          fallback="The Tamanu update was not accepted by the server. Please contact your system administrator."
        />
      );
    case UPDATE_BLOCKER.PACKAGE_UNAVAILABLE:
      return (
        <TranslatedText
          stringId="sync.paused.packageUnavailable"
          fallback="No Tamanu update is available for this server. Please contact your system administrator."
        />
      );
    case UPDATE_BLOCKER.NOT_ENOUGH_SPACE:
      return (
        <TranslatedText
          stringId="sync.paused.notEnoughSpace"
          fallback="Not enough space to update Tamanu."
        />
      );
    default:
      return null;
  }
};

/**
 * What the Sync tab shows while an update is outstanding. Sync cannot run until the update is
 * installed, so this says why rather than offering a manual sync the server would reject.
 */
export const SyncPausedForUpdate = (): ReactElement => {
  const { stage, progress, blocker, grantPermission, requestInstall } = useUpdate();

  const proportion = downloadProportion(progress.downloadedBytes, progress.totalBytes);
  const percent = proportion === null ? null : Math.round(proportion * 100);
  const isReady = stage === UPDATE_STAGE.READY || stage === UPDATE_STAGE.INSTALL_FAILED;
  const needsPermission = stage === UPDATE_STAGE.NEEDS_PERMISSION;
  const blockedReason = stage === UPDATE_STAGE.BLOCKED ? blockedReasonFor(blocker) : null;

  return (
    <StyledView alignItems="center">
      <PauseIcon size={screenPercentageToDP('8', Orientation.Height)} />
      <StyledText
        marginTop={25}
        fontWeight={500}
        color={theme.colors.SECONDARY_MAIN}
        fontSize={screenPercentageToDP(2.55, Orientation.Height)}
        textAlign="center"
      >
        <TranslatedText stringId="sync.paused.title" fallback="Sync paused" />
      </StyledText>
      <StyledText
        marginTop={screenPercentageToDP(1.2, Orientation.Height)}
        fontSize={screenPercentageToDP(1.7, Orientation.Height)}
        color={theme.colors.WHITE}
        textAlign="center"
      >
        {blockedReason ??
          (isReady ? (
            <TranslatedText
              stringId="sync.paused.updateReady"
              fallback="Tamanu needs to update before it can sync."
            />
          ) : needsPermission ? (
            <TranslatedText
              stringId="sync.paused.needsPermission"
              fallback="Tamanu needs permission to update before it can sync."
            />
          ) : percent === null ? (
            <TranslatedText
              stringId="sync.paused.downloading"
              fallback="Downloading a Tamanu update."
            />
          ) : (
            <TranslatedText
              stringId="sync.paused.downloadingWithProgress"
              fallback="Downloading a Tamanu update (:percent%)."
              replacements={{ percent }}
            />
          ))}
      </StyledText>
      {isReady && (
        // Spaced by a wrapper: Button applies its own margins twice
        <StyledView marginTop={screenPercentageToDP(2.3, Orientation.Height)}>
          <Button
            onPress={() => void requestInstall()}
            width={160}
            outline
            textColor={theme.colors.SECONDARY_MAIN}
            borderColor={theme.colors.SECONDARY_MAIN}
            buttonText={
              <TranslatedText stringId="update.action.installUpdate" fallback="Install update" />
            }
          />
        </StyledView>
      )}
      {needsPermission && (
        // Spaced by a wrapper: Button applies its own margins twice
        <StyledView marginTop={screenPercentageToDP(2.3, Orientation.Height)}>
          <Button
            onPress={grantPermission}
            width={160}
            outline
            textColor={theme.colors.SECONDARY_MAIN}
            borderColor={theme.colors.SECONDARY_MAIN}
            buttonText={<TranslatedText stringId="update.action.allow" fallback="Allow" />}
          />
        </StyledView>
      )}
    </StyledView>
  );
};
