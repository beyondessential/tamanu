import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import moment from 'moment';
import { CenterView, StyledText, StyledView } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';
import { Orientation, screenPercentageToDP, setStatusBar } from '../../../../helpers/screen';
import { BackendContext } from '../../../../contexts/BackendContext';
import { MobileSyncManager } from '../../../../../services/sync';
import { Button } from '../../../../components/Button';
import { CircularProgress } from '../../../../components/CircularProgress';
import { SyncErrorDisplay } from '../../../../components/SyncErrorDisplay';
import { SYNC_EVENT_ACTIONS } from '../../../../../constants';

export const SyncDataScreen = (): ReactElement => {
  const backend = useContext(BackendContext);
  const syncManager: MobileSyncManager = backend.syncManager;

  const formatLastSyncTime = (lastSyncTime): string => (lastSyncTime ? moment(lastSyncTime).fromNow() : '');

  const [isSyncing, setIsSyncing] = useState(syncManager.isSyncing);
  const [progress, setProgress] = useState(syncManager.progress);
  const [progressMessage, setProgressMessage] = useState(syncManager.progressMessage);
  const [formattedLastSyncTime, setFormattedLastSyncTime] = useState(
    formatLastSyncTime(syncManager.lastSyncTime),
  );

  setStatusBar('light-content', theme.colors.MAIN_SUPER_DARK);

  const manualSync = useCallback(() => {
    syncManager.triggerSync();
  }, []);

  useEffect(() => {
    const handler = (action, event) => {
      switch (action) {
        case SYNC_EVENT_ACTIONS.SYNC_STARTED:
          setIsSyncing(true);
          activateKeepAwake(); // don't let the device sleep while syncing
          break;
        case SYNC_EVENT_ACTIONS.SYNC_ENDED:
          setIsSyncing(false);
          setFormattedLastSyncTime(formatLastSyncTime(syncManager.lastSyncTime));
          deactivateKeepAwake();
          break;
        case SYNC_EVENT_ACTIONS.SYNC_IN_PROGRESS:
          setProgress(syncManager.progress);
          setProgressMessage(syncManager.progressMessage);
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
      setFormattedLastSyncTime(formatLastSyncTime(syncManager.lastSyncTime));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <CenterView background={theme.colors.MAIN_SUPER_DARK} flex={1}>
      <StyledView alignItems="center">
        <CircularProgress progress={isSyncing ? progress : 0} />
        <StyledText
          marginTop={25}
          fontWeight={500}
          color={theme.colors.SECONDARY_MAIN}
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          textAlign="center"
        >
          {isSyncing ? progressMessage : 'Up to date'}
        </StyledText>
        {!isSyncing && formattedLastSyncTime ? (
          <>
            <StyledText
              marginTop={screenPercentageToDP(9.72, Orientation.Height)}
              fontSize={screenPercentageToDP(1.7, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.WHITE}
            >
              Last successful Sync
            </StyledText>
            <StyledText
              fontSize={screenPercentageToDP(1.7, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.WHITE}
            >
              {formattedLastSyncTime}
            </StyledText>
          </>
        ) : (
          <StyledText
            marginTop={screenPercentageToDP(3.5, Orientation.Height)}
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            fontWeight={500}
            color={theme.colors.WHITE}
          >
            {progress}%
          </StyledText>
        )}
        {isSyncing ? null : (
          <Button
            onPress={manualSync}
            width={160}
            outline
            textColor={theme.colors.WHITE}
            borderColor={theme.colors.WHITE}
            buttonText="Manual Sync"
            marginTop={20}
          />
        )}
        <SyncErrorDisplay />
      </StyledView>
    </CenterView>
  );
};
