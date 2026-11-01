import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import Config from 'react-native-config';

import {
  UPDATE_BLOCKER,
  UPDATE_STAGE,
  type UpdateBlocker,
  type UpdateProgress,
  type UpdateStage,
  type UpdaterModule,
} from '~/types/Updater';
import {
  buildPackageUrl,
  hasEnoughSpace,
  retryDelay,
  shouldOfferManualFallback,
} from '~/services/update/updatePolicy';
import {
  hasInstalledUpdateAndStillOutOfDate,
  pendingUpdateEmitter,
  readPendingUpdate,
  recordInstallAttempt,
} from '~/services/update/pendingUpdate';
import { Branding } from '~/ui/hooks/useBranding';
import { useOnForeground } from '~/ui/hooks/useOnForeground';

const Updater: UpdaterModule = NativeModules.TamanuUpdater;
const PROGRESS_EVENT = 'tamanuUpdateProgress';

export interface AppUpdateState {
  /** Whether an update is outstanding. Staff keep working either way. */
  isUpdateOutstanding: boolean;
  stage: UpdateStage;
  progress: UpdateProgress;
  blocker: UpdateBlocker | null;
  /** The address the package can be downloaded from by hand, once that is worth offering. */
  manualUrl: string | null;
  /** Hands the package to Android, which closes the app to install it. */
  install: () => void;
  /** Puts a failed install behind them, leaving the package ready to install again. */
  dismissInstallFailure: () => void;
  /** Opens the Android settings screen that allows Tamanu to install apps. */
  grantPermission: () => void;
}

const NO_PROGRESS: UpdateProgress = { downloadedBytes: 0, totalBytes: -1 };

export const useAppUpdate = (): AppUpdateState => {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<UpdateStage>(UPDATE_STAGE.CHECKING);
  const [progress, setProgress] = useState<UpdateProgress>(NO_PROGRESS);
  const [blocker, setBlocker] = useState<UpdateBlocker | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isForeground = useOnForeground();

  const packageUrl = updateUrl && buildPackageUrl(updateUrl, Config.BRANDING || Branding.Tamanu);

  // An update outstanding from a previous launch, and one rejected while the app is running.
  useEffect(() => {
    readPendingUpdate().then(pending => {
      if (pending) setUpdateUrl(pending);
    });
    const onRecorded = (recordedUrl?: string) => {
      if (recordedUrl) setUpdateUrl(recordedUrl);
    };
    pendingUpdateEmitter.on('recorded', onRecorded);
    return () => pendingUpdateEmitter.off('recorded', onRecorded);
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      PROGRESS_EVENT,
      (next: UpdateProgress) => {
        setProgress(next);
      },
    );
    return () => subscription.remove();
  }, []);

  const block = useCallback((reason: UpdateBlocker) => {
    setBlocker(reason);
    setStage(UPDATE_STAGE.BLOCKED);
  }, []);

  /** Asks for the notification permission, which the update proceeds without if refused. */
  const requestNotificationPermission = useCallback(async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) return;
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    } catch (error) {
      console.warn('useAppUpdate: could not ask for notification permission', error);
    }
  }, []);

  const download = useCallback(async () => {
    if (!packageUrl) return;
    setStage(UPDATE_STAGE.DOWNLOADING);
    try {
      const packageBytes = await Updater.getPackageSize(packageUrl);
      if (packageBytes > 0) {
        const freeBytes = await Updater.getFreeDiskBytes();
        if (!hasEnoughSpace(freeBytes, packageBytes)) {
          setProgress({ downloadedBytes: 0, totalBytes: packageBytes });
          block(UPDATE_BLOCKER.NOT_ENOUGH_SPACE);
          return;
        }
      }
      await Updater.startDownload(packageUrl);
      setStage(UPDATE_STAGE.READY);
    } catch (error) {
      console.warn('useAppUpdate: download failed', error);
      setFailedAttempts(attempts => attempts + 1);
      setStage(UPDATE_STAGE.RETRYING);
    }
  }, [packageUrl, block]);

  const begin = useCallback(async () => {
    if (!packageUrl) return;

    if (await hasInstalledUpdateAndStillOutOfDate()) {
      block(UPDATE_BLOCKER.STILL_OUT_OF_DATE);
      return;
    }

    const status = await Updater.getStatus();
    if (!status.canPostNotifications) {
      await requestNotificationPermission();
    }

    // The package can download while the device is still being set up to install it, so the
    // permission is only asked for once there is something waiting to be installed.
    if (status.hasCompletedDownload) {
      setStage(status.canInstallPackages ? UPDATE_STAGE.READY : UPDATE_STAGE.NEEDS_PERMISSION);
      return;
    }
    await download();
  }, [packageUrl, block, download, requestNotificationPermission]);

  useEffect(() => {
    if (packageUrl && stage === UPDATE_STAGE.CHECKING) {
      begin();
    }
  }, [packageUrl, stage, begin]);

  // Wait out the gap between attempts, which lengthens with each failure.
  useEffect(() => {
    if (stage !== UPDATE_STAGE.RETRYING) return undefined;
    retryTimer.current = setTimeout(() => download(), retryDelay(failedAttempts));
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [stage, failedAttempts, download]);

  // A download that finishes while the device still won't allow installing holds at the ask,
  // which is also re-checked whenever staff come back from Android's settings.
  useEffect(() => {
    if (!isForeground) return;
    if (stage !== UPDATE_STAGE.READY && stage !== UPDATE_STAGE.NEEDS_PERMISSION) return;
    Updater.getStatus().then(status => {
      setStage(status.canInstallPackages ? UPDATE_STAGE.READY : UPDATE_STAGE.NEEDS_PERMISSION);
    });
  }, [stage, isForeground]);

  const grantPermission = useCallback(() => {
    Updater.openInstallPermissionSettings();
  }, []);

  const install = useCallback(async () => {
    setStage(UPDATE_STAGE.INSTALLING);
    await recordInstallAttempt();
    try {
      await Updater.installDownloadedPackage();
      // A successful install replaces the app and closes it, so there is nothing to do here and
      // usually nothing left running to do it in.
    } catch (error) {
      console.warn('useAppUpdate: install failed', error);
      setStage(UPDATE_STAGE.INSTALL_FAILED);
    }
  }, []);

  // The package is still downloaded and still installable, so a failure staff have dismissed
  // simply returns them to the ready banner.
  const dismissInstallFailure = useCallback(() => {
    setStage(UPDATE_STAGE.READY);
  }, []);

  const offerManualUrl =
    blocker !== null || shouldOfferManualFallback(failedAttempts) ? updateUrl : null;

  return {
    isUpdateOutstanding: Boolean(updateUrl),
    stage,
    progress,
    blocker,
    manualUrl: offerManualUrl,
    install,
    dismissInstallFailure,
    grantPermission,
  };
};
