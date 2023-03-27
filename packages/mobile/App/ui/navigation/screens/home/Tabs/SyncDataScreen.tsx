import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import { formatDistance } from 'date-fns';
import { CenterView, StyledText, StyledView } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';
import { Orientation, screenPercentageToDP, setStatusBar } from '../../../../helpers/screen';
import { BackendContext } from '../../../../contexts/BackendContext';
import {
  MobileSyncManager,
  SYNC_STAGES_TOTAL,
  SYNC_EVENT_ACTIONS,
} from '../../../../../services/sync';
import { Button } from '../../../../components/Button';
import { SyncErrorDisplay } from '../../../../components/SyncErrorDisplay';
import { GreenTickIcon, ErrorIcon } from '../../../../components/Icons';

export const SyncDataScreen = ({ navigation }): ReactElement => {
  const backend = useContext(BackendContext);
  const syncManager: MobileSyncManager = backend.syncManager;

  const formatLastSuccessfulSyncTick = (lastSuccessfulSyncTick: string): string =>
    lastSuccessfulSyncTick
      ? formatDistance(new Date(lastSuccessfulSyncTick), new Date(), { addSuffix: true })
      : '';

  const [syncStarted, setSyncStarted] = useState(syncManager.isSyncing);
  const [hasError, setHasError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(syncManager.isSyncing);
  const [syncStage, setSyncStage] = useState(syncManager.syncStage);
  const [progress, setProgress] = useState(syncManager.progress);
  const [progressMessage, setProgressMessage] = useState(syncManager.progressMessage);
  const [formattedLastSuccessfulSyncTick, setFormattedLastSuccessfulSyncTick] = useState(
    formatLastSuccessfulSyncTick(syncManager.lastSuccessfulSyncTick),
  );
  const [lastSyncPushedRecordsCount, setLastSyncPushedRecordsCount] = useState(null);
  const [lastSyncPulledRecordsCount, setLastSyncPulledRecordsCount] = useState(null);

  setStatusBar('light-content', theme.colors.MAIN_SUPER_DARK);

  const manualSync = useCallback(() => {
    syncManager.triggerSync();
  }, []);

  useEffect(() => {
    // Add this listener to detect when users exit/switch to another tab
    const unsubscribe = navigation.addListener('blur', () => {
      if (!isSyncing) {
        setSyncStarted(false);
      }
    });

    return unsubscribe;
  }, [navigation, isSyncing]);

  useEffect(() => {
    const handler = (action: string): void => {
      switch (action) {
        case SYNC_EVENT_ACTIONS.SYNC_STARTED:
          setSyncStarted(true);
          setIsSyncing(true);
          setProgress(0);
          setProgressMessage('Initialising sync');
          setHasError(false);
          activateKeepAwake(); // don't let the device sleep while syncing
          break;
        case SYNC_EVENT_ACTIONS.SYNC_ENDED:
          setIsSyncing(false);
          setProgress(0);
          setProgressMessage('');
          deactivateKeepAwake();
          break;
        case SYNC_EVENT_ACTIONS.SYNC_STATE_CHANGED:
          setSyncStage(syncManager.syncStage);
          setProgress(syncManager.progress);
          setProgressMessage(syncManager.progressMessage);
          setFormattedLastSuccessfulSyncTick(
            formatLastSuccessfulSyncTick(syncManager.lastSuccessfulSyncTick),
          );
          setLastSyncPushedRecordsCount(syncManager.lastSyncPushedRecordsCount);
          setLastSyncPulledRecordsCount(syncManager.lastSyncPulledRecordsCount);
          break;
        case SYNC_EVENT_ACTIONS.SYNC_ERROR:
          setHasError(true);
          break;
        default:
          break;
      }
    };
    syncManager.emitter.on('*', handler);
    return () => {
      syncManager.emitter.off('*', handler);
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFormattedLastSuccessfulSyncTick(
        formatLastSuccessfulSyncTick(syncManager.lastSuccessfulSyncTick),
      );
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const syncFinishedSuccessfully = syncStarted && !isSyncing && !hasError;

  return (
    <CenterView background={theme.colors.MAIN_SUPER_DARK} flex={1}>
      <StyledView alignItems="center">
        {isSyncing ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.SECONDARY_MAIN}
            style={{ transform: [{ scaleX: 2 }, { scaleY: 2 }] }}
          />
        ) : null}
        {syncFinishedSuccessfully ? (
          <GreenTickIcon size={screenPercentageToDP('8', Orientation.Height)} />
        ) : null}
        {hasError ? <ErrorIcon size={screenPercentageToDP('8', Orientation.Height)} /> : null}
        {hasError ? (
          <StyledText
            marginTop={25}
            fontWeight={500}
            color="#F76853"
            fontSize={screenPercentageToDP(2.55, Orientation.Height)}
            textAlign="center"
          >
            Sync failed
          </StyledText>
        ) : null}
        {isSyncing || syncFinishedSuccessfully ? (
          <StyledText
            marginTop={25}
            fontWeight={500}
            color={theme.colors.SECONDARY_MAIN}
            fontSize={screenPercentageToDP(2.55, Orientation.Height)}
            textAlign="center"
          >
            {isSyncing ? `${progress} %` : null}
            {syncFinishedSuccessfully ? '100 %' : null}
          </StyledText>
        ) : null}
        {isSyncing ? null : (
          <Button
            onPress={manualSync}
            width={160}
            outline
            textColor={theme.colors.SECONDARY_MAIN}
            borderColor={theme.colors.SECONDARY_MAIN}
            buttonText="Manual sync"
            marginTop={20}
          />
        )}
        {isSyncing && syncStage ? (
          <StyledText
            marginTop={screenPercentageToDP(8, Orientation.Height)}
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            fontWeight={500}
            color={theme.colors.WHITE}
          >
            {`${syncStage} of ${SYNC_STAGES_TOTAL} syncing`}
          </StyledText>
        ) : null}
        {isSyncing ? (
          <StyledText
            marginTop={screenPercentageToDP(0.5, Orientation.Height)}
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.WHITE}
          >
            {progressMessage}
          </StyledText>
        ) : null}
        {!isSyncing && formattedLastSuccessfulSyncTick ? (
          <>
            <StyledText
              marginTop={screenPercentageToDP(1.72, Orientation.Height)}
              fontSize={screenPercentageToDP(1.7, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.WHITE}
            >
              Last successful sync
            </StyledText>
            <StyledText
              fontSize={screenPercentageToDP(1.7, Orientation.Height)}
              color={theme.colors.WHITE}
            >
              {formattedLastSuccessfulSyncTick}
            </StyledText>
            {!isSyncing &&
            lastSyncPulledRecordsCount !== null &&
            lastSyncPushedRecordsCount !== null ? (
              <StyledText
                fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                color={theme.colors.WHITE}
              >
                {`pulled ${lastSyncPulledRecordsCount} change${
                  lastSyncPulledRecordsCount === 1 ? '' : 's'
                }, pushed ${lastSyncPushedRecordsCount} change${
                  lastSyncPushedRecordsCount === 1 ? '' : 's'
                }`}
              </StyledText>
            ) : null}
          </>
        ) : null}
        <SyncErrorDisplay />
      </StyledView>
    </CenterView>
  );
};
