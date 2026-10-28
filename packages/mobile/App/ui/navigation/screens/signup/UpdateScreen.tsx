import React, { type ReactElement } from 'react';
import { Linking } from 'react-native';

import { StyledSafeAreaView, StyledText, StyledView } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Button } from '/components/Button';
import {
  UPDATE_BLOCKER,
  UPDATE_STAGE,
  type UpdateBlocker,
  type UpdateProgress,
  type UpdateStage,
} from '~/types/Updater';
import { downloadProportion } from '~/services/update/updatePolicy';

interface UpdateScreenProps {
  stage: UpdateStage;
  progress: UpdateProgress;
  blocker: UpdateBlocker | null;
  manualUrl: string | null;
  tryAgainNow: () => void;
  grantPermission: () => void;
}

const PROGRESS_TRACK_COLOUR = 'rgba(255, 255, 255, 0.3)';

const ProgressBar = ({ proportion }: { proportion: number | null }): ReactElement => (
  <StyledView
    marginTop={screenPercentageToDP('3', Orientation.Height)}
    width={screenPercentageToDP('70', Orientation.Width)}
    height={8}
    borderRadius={4}
    background={PROGRESS_TRACK_COLOUR}
  >
    <StyledView
      width={`${(proportion ?? 0) * 100}%`}
      height={8}
      borderRadius={4}
      background={theme.colors.SECONDARY_MAIN}
    />
  </StyledView>
);

const StageMessage = ({
  stage,
  progress,
}: {
  stage: UpdateStage;
  progress: UpdateProgress;
}): ReactElement => {
  const proportion = downloadProportion(progress.downloadedBytes, progress.totalBytes);

  if (stage === UPDATE_STAGE.INSTALLING) {
    return (
      <TranslatedText
        stringId="update.stage.installing"
        fallback="Installing the update. Tamanu will close while this finishes."
      />
    );
  }

  if (stage === UPDATE_STAGE.RETRYING) {
    return (
      <TranslatedText
        stringId="update.stage.retrying"
        fallback="The download was interrupted. Trying again shortly."
      />
    );
  }

  if (stage === UPDATE_STAGE.DOWNLOADING && proportion !== null) {
    return (
      <TranslatedText
        stringId="update.stage.downloadingWithProgress"
        fallback="Downloading the update: :percent%"
        replacements={{ percent: Math.round(proportion * 100) }}
      />
    );
  }

  return <TranslatedText stringId="update.stage.downloading" fallback="Downloading the update" />;
};

const BlockerMessage = ({ blocker }: { blocker: UpdateBlocker }): ReactElement => {
  switch (blocker) {
    case UPDATE_BLOCKER.NOT_ENOUGH_SPACE:
      return (
        <TranslatedText
          stringId="update.blocker.notEnoughSpace"
          fallback="There is not enough free space on this device to install the update. Free up some space, or install the update by hand."
        />
      );
    case UPDATE_BLOCKER.PERMISSION_REFUSED:
      return (
        <TranslatedText
          stringId="update.blocker.permissionRefused"
          fallback="Tamanu cannot install the update without permission to install apps on this device. You can install the update by hand instead."
        />
      );
    case UPDATE_BLOCKER.STILL_OUT_OF_DATE:
      return (
        <TranslatedText
          stringId="update.blocker.stillOutOfDate"
          fallback="Tamanu updated, but this server still will not accept it. Please contact your administrator."
        />
      );
    default:
      return (
        <TranslatedText
          stringId="update.blocker.repeatedFailures"
          fallback="The update could not be downloaded. Tamanu will keep trying, or you can install it by hand."
        />
      );
  }
};

export const UpdateScreen = ({
  stage,
  progress,
  blocker,
  manualUrl,
  tryAgainNow,
  grantPermission,
}: UpdateScreenProps): ReactElement => {
  const isBlocked = stage === UPDATE_STAGE.BLOCKED;
  const needsPermission = stage === UPDATE_STAGE.NEEDS_PERMISSION;
  const proportion = downloadProportion(progress.downloadedBytes, progress.totalBytes);

  return (
    <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN} alignItems="center">
      <StyledText
        marginTop={screenPercentageToDP('7.29', Orientation.Height)}
        color={theme.colors.WHITE}
        fontWeight="bold"
        fontSize={screenPercentageToDP('2.18', Orientation.Height)}
      >
        <TranslatedText stringId="update.title" fallback="Updating Tamanu" />
      </StyledText>

      <StyledView
        marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
        marginRight={screenPercentageToDP('12.16', Orientation.Width)}
      >
        <StyledText
          textAlign="center"
          marginTop={screenPercentageToDP('1.21', Orientation.Height)}
          color={theme.colors.WHITE}
          fontSize={screenPercentageToDP(1.94, Orientation.Height)}
        >
          {isBlocked && blocker ? (
            <BlockerMessage blocker={blocker} />
          ) : needsPermission ? (
            <TranslatedText
              stringId="update.permission.explanation"
              fallback="Tamanu needs this device's permission to install its own update. You only need to allow this once."
            />
          ) : (
            <TranslatedText
              stringId="update.message"
              fallback="Tamanu is out of date and is updating itself. You cannot use the app until it finishes."
            />
          )}
        </StyledText>
      </StyledView>

      {!isBlocked && !needsPermission && <ProgressBar proportion={proportion} />}

      {!isBlocked && !needsPermission && (
        <StyledView
          marginTop={screenPercentageToDP('1.5', Orientation.Height)}
          marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
          marginRight={screenPercentageToDP('12.16', Orientation.Width)}
        >
          <StyledText
            textAlign="center"
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(1.72, Orientation.Height)}
          >
            <StageMessage stage={stage} progress={progress} />
          </StyledText>
        </StyledView>
      )}

      {stage !== UPDATE_STAGE.INSTALLING && !isBlocked && !needsPermission && (
        <StyledView
          marginTop={screenPercentageToDP('2', Orientation.Height)}
          marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
          marginRight={screenPercentageToDP('12.16', Orientation.Width)}
        >
          <StyledText
            textAlign="center"
            color={theme.colors.WHITE}
            fontSize={screenPercentageToDP(1.72, Orientation.Height)}
          >
            <TranslatedText
              stringId="update.closeWarning"
              fallback="Tamanu will close to install the update. Open it again from the Tamanu icon when it does."
            />
          </StyledText>
        </StyledView>
      )}

      {needsPermission && (
        <Button
          marginTop={20}
          width={screenPercentageToDP('70', Orientation.Width)}
          backgroundColor={theme.colors.SECONDARY_MAIN}
          onPress={grantPermission}
          textColor={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
          fontWeight={500}
          buttonText={
            <TranslatedText stringId="update.action.allowInstall" fallback="Allow installing" />
          }
        />
      )}

      {stage === UPDATE_STAGE.RETRYING && (
        <Button
          marginTop={20}
          width={screenPercentageToDP('70', Orientation.Width)}
          backgroundColor={theme.colors.SECONDARY_MAIN}
          onPress={tryAgainNow}
          textColor={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
          fontWeight={500}
          buttonText={
            <TranslatedText stringId="update.action.tryAgainNow" fallback="Try again now" />
          }
        />
      )}

      {manualUrl && (
        <StyledView alignItems="center">
          <Button
            marginTop={20}
            width={screenPercentageToDP('70', Orientation.Width)}
            backgroundColor={theme.colors.WHITE}
            onPress={() => Linking.openURL(manualUrl)}
            textColor={theme.colors.PRIMARY_MAIN}
            fontSize={screenPercentageToDP('1.94', Orientation.Height)}
            fontWeight={500}
            buttonText={
              <TranslatedText stringId="update.action.downloadByHand" fallback="Download by hand" />
            }
          />
          <StyledView
            marginTop={screenPercentageToDP('1.5', Orientation.Height)}
            marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
            marginRight={screenPercentageToDP('12.16', Orientation.Width)}
          >
            <StyledText
              textAlign="center"
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(1.72, Orientation.Height)}
            >
              <TranslatedText
                stringId="update.manualFallback"
                fallback="This installs the same update. Contact your administrator if you cannot complete it."
              />
            </StyledText>
          </StyledView>
        </StyledView>
      )}
    </StyledSafeAreaView>
  );
};
