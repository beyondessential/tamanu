import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import { CenterView, StyledText, StyledView } from '../../../../styled/common';
import { theme } from '../../../../styled/theme';
import { Orientation, screenPercentageToDP, setStatusBar } from '../../../../helpers/screen';
import { BackendContext } from '../../../../contexts/BackendContext';
import {
  SYNC_EVENT_ACTIONS,
} from '../../../../../services/sync';
import { Button } from '../../../../components/Button';
import { SyncErrorDisplay } from '../../../../components/SyncErrorDisplay';
import { ErrorIcon, GreenTickIcon } from '../../../../components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useTranslation } from '/contexts/TranslationContext';
import { formatlastSuccessfulSyncTime } from '~/ui/helpers/date';

export const SyncDataScreen = ({ navigation }): ReactElement => {
  const backend = useContext(BackendContext) as BackendContext;
  const syncManager = backend.syncManager;
  const { getTranslation } = useTranslation();

  const [syncStarted, setSyncStarted] = useState(syncManager.isSyncing);
  const [hasError, setHasError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(syncManager.isSyncing);
  const [isQueuing, setIsQueuing] = useState(syncManager.isQueuing);
  const [syncStage, setSyncStage] = useState(syncManager.syncStage);
  const [progress, setProgress] = useState(syncManager.progress);
  const [progressMessage, setProgressMessage] = useState(syncManager.progressMessage);
  const [formattedLastSuccessfulSyncTime, setFormattedLastSuccessfulSyncTime] = useState(
    formatlastSuccessfulSyncTime(syncManager.lastSuccessfulSyncTime),
  );
  const [lastSyncPushedRecordsCount, setLastSyncPushedRecordsCount] = useState(null);
  const [lastSyncPulledRecordsCount, setLastSyncPulledRecordsCount] = useState(null);

  setStatusBar('light-content', theme.colors.MAIN_SUPER_DARK);

  const manualSync = useCallback(() => {
    syncManager.triggerUrgentSync();
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
        case SYNC_EVENT_ACTIONS.SYNC_IN_QUEUE:
          setProgress(0);
          setIsQueuing(true);
          setIsSyncing(false);
          setHasError(false);
          setProgressMessage(syncManager.progressMessage);
          break;
        case SYNC_EVENT_ACTIONS.SYNC_STARTED:
          setIsQueuing(false);
          setSyncStarted(true);
          setIsSyncing(true);
          setProgress(0);
          setProgressMessage('Initialising sync');
          setHasError(false);
          activateKeepAwake(); // don't let the device sleep while syncing
          break;
        case SYNC_EVENT_ACTIONS.SYNC_ENDED:
          setIsQueuing(false);
          setIsSyncing(false);
          setProgress(0);
          setProgressMessage('');
          deactivateKeepAwake();
          break;
        case SYNC_EVENT_ACTIONS.SYNC_STATE_CHANGED:
          setSyncStage(syncManager.syncStage);
          setProgress(syncManager.progress);
          setProgressMessage(syncManager.progressMessage);
          setFormattedLastSuccessfulSyncTime(
            formatlastSuccessfulSyncTime(syncManager.lastSuccessfulSyncTime),
          );
          setLastSyncPushedRecordsCount(syncManager.lastSyncPushedRecordsCount);
          setLastSyncPulledRecordsCount(syncManager.lastSyncPulledRecordsCount);
          break;
        case SYNC_EVENT_ACTIONS.SYNC_ERROR:
          setIsQueuing(false);
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
      setFormattedLastSuccessfulSyncTime(
        formatlastSuccessfulSyncTime(syncManager.lastSuccessfulSyncTime),
      );
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const syncFinishedSuccessfully = syncStarted && !isSyncing && !isQueuing && !hasError;

  const changeTranslation = getTranslation('sync.message.syncSummary.change', 'change');
  const changePluralTranslation = getTranslation(
    'sync.message.syncSummary.changePlural',
    'changes',
  );

  return (
    <CenterView background={theme.colors.MAIN_SUPER_DARK} flex={1}>
      <StyledView alignItems="center">
        {/* Circular progress */}
        {(isSyncing || isQueuing) && !hasError ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.SECONDARY_MAIN}
            style={{ transform: [{ scaleX: 2 }, { scaleY: 2 }] }}
          />
        ) : null}
        {/* Queuing message */}
        {isQueuing ? (
          <StyledText
            marginTop={screenPercentageToDP(5, Orientation.Height)}
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            color={theme.colors.WHITE}
          >
            {progressMessage}
          </StyledText>
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
            <TranslatedText stringId="sync.error.syncFailed" fallback="Sync failed" />
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
            buttonText={<TranslatedText stringId="sync.action.manualSync" fallback="Manual sync" />}
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
            {
              <TranslatedText
                stringId="sync.message.syncStatus"
                fallback=":currentSyncStage of :totalSyncStages syncing"
                replacements={{
                  currentSyncStage: syncStage,
                  totalSyncStages: Object.keys(syncManager.progressMaxByStage).length,
                }}
              />
            }
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
        {!isSyncing && formattedLastSuccessfulSyncTime ? (
          <>
            <StyledText
              marginTop={screenPercentageToDP(1.72, Orientation.Height)}
              fontSize={screenPercentageToDP(1.7, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.WHITE}
            >
              <TranslatedText
                stringId="sync.subHeading.lastSuccessfulSync"
                fallback="Last successful sync"
              />
            </StyledText>
            <StyledText
              fontSize={screenPercentageToDP(1.7, Orientation.Height)}
              color={theme.colors.WHITE}
            >
              {formattedLastSuccessfulSyncTime}
            </StyledText>
            {!isSyncing &&
            lastSyncPulledRecordsCount !== null &&
            lastSyncPushedRecordsCount !== null ? (
              <StyledText
                fontSize={screenPercentageToDP(1.7, Orientation.Height)}
                color={theme.colors.WHITE}
              >
                <TranslatedText
                  stringId="sync.message.syncSummary"
                  fallback="pulled :pullCount :pullChange, pushed :pushCount :pushChange"
                  replacements={{
                    pullCount: lastSyncPulledRecordsCount,
                    pullChange:
                      lastSyncPulledRecordsCount === 1
                        ? changeTranslation
                        : changePluralTranslation,
                    pushCount: lastSyncPushedRecordsCount,
                    pushChange:
                      lastSyncPushedRecordsCount === 1
                        ? changeTranslation
                        : changePluralTranslation,
                  }}
                />
              </StyledText>
            ) : null}
          </>
        ) : null}
        <SyncErrorDisplay />
      </StyledView>
    </CenterView>
  );
};
