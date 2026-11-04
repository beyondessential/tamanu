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
  /** Asks to post the "Tamanu has been updated" notification, before the install is confirmed. */
  prepareInstall: () => Promise<void>;
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
    const subscription = DeviceEventEmitter.addListener(PROGRESS_EVENT, (next: UpdateProgress) => {
      setProgress(next);
    });
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
      // The size only feeds the space check, and some servers refuse HEAD, so a failed probe leaves
      // it unknown rather than stopping a download the GET would complete
      const packageBytes = await Updater.getPackageSize(packageUrl).catch(() => -1);
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
      // No package at the address is a refusal, not a dropped connection, so retrying won't help
      if ((error as { code?: string }).code === 'PACKAGE_UNAVAILABLE') {
        block(UPDATE_BLOCKER.PACKAGE_UNAVAILABLE);
        return;
      }
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

    // The package can download while the device is still being set up to install it, so the
    // permission is only asked for once there is something waiting to be installed.
    if (status.hasCompletedDownload) {
      setStage(status.canInstallPackages ? UPDATE_STAGE.READY : UPDATE_STAGE.NEEDS_PERMISSION);
      return;
    }
    await download();
  }, [packageUrl, block, download]);

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

  /**
   * Asked when staff tap Install, the moment the notification becomes useful, rather than while
   * they are still working and the update has only just started downloading.
   */
  const prepareInstall = useCallback(async () => {
    const status = await Updater.getStatus();
    if (!status.canPostNotifications) {
      await requestNotificationPermission();
    }
  }, [requestNotificationPermission]);

  const install = useCallback(async () => {
    // A package found stale or unreadable since it downloaded has been discarded, so trying again
    // fetches a fresh one rather than failing on the missing file
    const { hasCompletedDownload } = await Updater.getStatus();
    if (!hasCompletedDownload) {
      setStage(UPDATE_STAGE.CHECKING);
      return;
    }
    setStage(UPDATE_STAGE.INSTALLING);
    await recordInstallAttempt();
    try {
      await Updater.installDownloadedPackage();
      // A successful install replaces the app and closes it, so there is nothing to do here and
      // usually nothing left running to do it in.
    } catch (error) {
      // Cancelling Android's confirmation installs nothing and leaves the update ready to install
      if ((error as { code?: string }).code === 'INSTALL_ABORTED') {
        setStage(UPDATE_STAGE.READY);
        return;
      }
      console.warn('useAppUpdate: install failed', error);
      setStage(UPDATE_STAGE.INSTALL_FAILED);
    }
  }, []);

  // Checking afresh returns staff to the ready banner while the package is still installable, and
  // downloads a new one if it has been discarded.
  const dismissInstallFailure = useCallback(() => {
    setStage(UPDATE_STAGE.CHECKING);
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
    prepareInstall,
  };
};
