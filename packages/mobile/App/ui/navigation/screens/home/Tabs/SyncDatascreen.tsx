import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { CenterView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import moment from 'moment/src/moment';
import { Orientation, screenPercentageToDP, setStatusBar } from '~/ui/helpers/screen';
import { BackendContext } from '~/ui/contexts/BackendContext';
import { SyncManager } from '~/services/sync';
import { CircularProgress } from '/components/CircularProgress';

import { SyncErrorDisplay } from '~/ui/components/SyncErrorDisplay';

export const SyncDataScreen = (props): ReactElement => {
  const backend = useContext(BackendContext);
  const syncManager: SyncManager = backend.syncManager;

  const formatLastSyncTime = (lastSyncTime) => (lastSyncTime ? moment(lastSyncTime).fromNow() : '');

  const [isSyncing, setIsSyncing] = useState(syncManager.isSyncing);
  const [progress, setProgress] = useState(syncManager.progress);
  const [channelName, setChannelName] = useState();
  const [formattedLastSyncTime, setFormattedLastSyncTime] = useState(formatLastSyncTime(syncManager.lastSyncTime));

  setStatusBar('light-content', theme.colors.MAIN_SUPER_DARK);

  const manualSync = useCallback(() => {
    syncManager.runScheduledSync();
  }, []);

  const errorDisplayAvailable = true;

  useEffect(() => {
    const handler = (action, event) => {
      switch (action) {
        case 'syncStarted':
          setIsSyncing(true);
          break;
        case 'syncEnded':
          setIsSyncing(false);
          setFormattedLastSyncTime(formatLastSyncTime(syncManager.lastSyncTime));
          break;
        case 'progress':
          setProgress(syncManager.progress);
          break;
        case 'channelSyncStarted': {
          const channel = event;
          const prettyChannel = channel.split(/(?=[A-Z])/).join(' ').toLowerCase(); // e.g. scheduledVaccine -> scheduled vaccine
          setChannelName(prettyChannel);
          break;
        }
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
          {isSyncing ? (`Syncing ${channelName} data`) : 'Up to date'}
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
        {isSyncing ? null
          : (
            <Button
              onPress={manualSync}
              width={160}
              outline
              textColor={theme.colors.WHITE}
              borderColor={theme.colors.WHITE}
              buttonText="Manual Sync"
              marginTop={20}
            />
          )
        }
        <SyncErrorDisplay />
      </StyledView>
    </CenterView>
  );
};

