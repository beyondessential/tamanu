import React, { type ReactElement, useState } from 'react';

import { UPDATE_STAGE } from '~/types/Updater';
import { useUpdate } from '~/ui/contexts/UpdateContext';
import { downloadProportion } from '~/services/update/updatePolicy';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Button } from './Button';
import { TranslatedText } from './Translations/TranslatedText';
import { UpdateModals } from './UpdateModals';

/**
 * What the Sync tab shows while an update is outstanding. Sync cannot run until the update is
 * installed, so this says why rather than offering a manual sync the server would reject.
 */
export const SyncPausedForUpdate = (): ReactElement => {
  const { stage, progress, install } = useUpdate();
  const [confirming, setConfirming] = useState(false);

  const proportion = downloadProportion(progress.downloadedBytes, progress.totalBytes);
  const percent = proportion === null ? null : Math.round(proportion * 100);
  const isReady = stage === UPDATE_STAGE.READY || stage === UPDATE_STAGE.INSTALL_FAILED;

  return (
    <StyledView alignItems="center">
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
        {isReady ? (
          <TranslatedText
            stringId="sync.paused.updateReady"
            fallback="Tamanu needs it to update before it can sync."
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
        )}
      </StyledText>
      {isReady && (
        <Button
          onPress={() => void setConfirming(true)}
          width={160}
          outline
          textColor={theme.colors.SECONDARY_MAIN}
          borderColor={theme.colors.SECONDARY_MAIN}
          buttonText={
            <TranslatedText stringId="update.action.installUpdate" fallback="Install update" />
          }
          marginTop={20}
        />
      )}
      <UpdateModals
        confirming={confirming}
        onCancelConfirm={() => void setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          install();
        }}
      />
    </StyledView>
  );
};
