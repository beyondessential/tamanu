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
  recordPackageSource,
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
  // Read after a download settles, to tell whether the server has moved on to another release since
  const currentPackageUrl = useRef(packageUrl);
  currentPackageUrl.current = packageUrl;
  const currentStage = useRef(stage);
  currentStage.current = stage;

  // An update outstanding from a previous launch, and one rejected while the app is running.
  useEffect(() => {
    // Saved on the device, so an update cut short by the app closing resumes on the next launch
    readPendingUpdate().then(pending => {
      if (pending) setUpdateUrl(pending);
    });
    // Recorded by AuthContext when the server rejects this version while the app is running
    const onRecorded = (recordedUrl?: string) => {
      if (recordedUrl) setUpdateUrl(recordedUrl);
    };
    // Cleared once the server accepts this version, so there is nothing left to update to
    const onCleared = () => setUpdateUrl(null);
    pendingUpdateEmitter.on('recorded', onRecorded);
    pendingUpdateEmitter.on('cleared', onCleared);
    return () => {
      pendingUpdateEmitter.off('recorded', onRecorded);
      pendingUpdateEmitter.off('cleared', onCleared);
    };
  }, []);

  // spec: MUPD#detecting-an-out-of-date-app
  // The server can name a different release, or none, while an update is under way: an address
  // corrected, a newer release, or this version accepted after all. The update starts again from
  // the new address, and begin discards whatever was fetched for the old one. An install already
  // handed to Android is left to finish.
  const previousPackageUrl = useRef(packageUrl);
  useEffect(() => {
    const previous = previousPackageUrl.current;
    previousPackageUrl.current = packageUrl;
    if (!previous || previous === packageUrl) return;
    if (currentStage.current === UPDATE_STAGE.INSTALLING) return;

    setProgress(NO_PROGRESS);
    setBlocker(null);
    setFailedAttempts(0);
    setStage(UPDATE_STAGE.CHECKING);
    if (!packageUrl) {
      Updater.cancelDownload().then(() => Updater.clearDownload());
    }
  }, [packageUrl]);

  // Download progress reported by the native downloader, for the percentage on the banner and Sync tab
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(PROGRESS_EVENT, (next: UpdateProgress) => {
      setProgress(next);
    });
    return () => subscription.remove();
  }, []);

  // Stops at a failure retrying can't fix, until the next launch or the server naming another
  // release. The reason picks the banner's message.
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

  // Checks there's room, then downloads the package. A refused package blocks; any other failure
  // retries after a lengthening gap.
  const download = useCallback(async () => {
    if (!packageUrl) return;
    setStage(UPDATE_STAGE.DOWNLOADING);

    // The size probe is only a courtesy for the space check below; a server that cannot answer it
    // (a 405 to HEAD is common) is not reason enough to give up before even trying the download.
    let packageBytes = -1;
    try {
      packageBytes = await Updater.getPackageSize(packageUrl);
    } catch (error) {
      console.warn('useAppUpdate: could not read the package size', error);
    }
    // The server named another release meanwhile, and the update has started again for that
    if (currentPackageUrl.current !== packageUrl) return;

    if (packageBytes > 0) {
      const freeBytes = await Updater.getFreeDiskBytes();
      if (!hasEnoughSpace(freeBytes, packageBytes)) {
        setProgress({ downloadedBytes: 0, totalBytes: packageBytes });
        block(UPDATE_BLOCKER.NOT_ENOUGH_SPACE);
        return;
      }
    }

    try {
      await Updater.startDownload(packageUrl);
      if (currentPackageUrl.current !== packageUrl) return;
      setStage(UPDATE_STAGE.READY);
    } catch (error) {
      // Cancelled because the server named another release, which the update has started again for
      if (currentPackageUrl.current !== packageUrl) return;
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

  // Picks up from wherever the update stands: blocked if an install already failed to satisfy the
  // server, ready if the package is already downloaded, otherwise downloads it.
  const begin = useCallback(async () => {
    if (!packageUrl) return;

    if (await recordPackageSource(packageUrl)) {
      await Updater.cancelDownload();
      await Updater.clearDownload();
    }

    if (await hasInstalledUpdateAndStillOutOfDate()) {
      block(UPDATE_BLOCKER.STILL_OUT_OF_DATE);
      return;
    }

    const status = await Updater.getStatus();
    if (currentPackageUrl.current !== packageUrl) return;

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

  // A download that finishes while the device still don't have permission to install - holds at the ask,
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

  // The same branded address the app downloads from, since the update server picks the package by it
  const offerManualUrl =
    blocker !== null || shouldOfferManualFallback(failedAttempts) ? packageUrl : null;

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
