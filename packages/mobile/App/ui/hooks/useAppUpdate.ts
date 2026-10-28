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

interface AppUpdateState {
  isUpdateRequired: boolean;
  stage: UpdateStage;
  progress: UpdateProgress;
  blocker: UpdateBlocker | null;
  /** The address the package can be downloaded from by hand, once that is worth offering. */
  manualUrl: string | null;
  tryAgainNow: () => void;
  grantPermission: () => void;
}

const NO_PROGRESS: UpdateProgress = { downloadedBytes: 0, totalBytes: -1 };

export const useAppUpdate = (): AppUpdateState => {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<UpdateStage>(UPDATE_STAGE.CHECKING);
  const [progress, setProgress] = useState<UpdateProgress>(NO_PROGRESS);
  const [blocker, setBlocker] = useState<UpdateBlocker | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  // Counting permission asks separately: the first decline re-explains, the second falls back.
  const [permissionAsks, setPermissionAsks] = useState(0);
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

  const install = useCallback(async () => {
    setStage(UPDATE_STAGE.INSTALLING);
    await recordInstallAttempt();
    try {
      await Updater.installDownloadedPackage();
      // A successful install replaces the app and closes it, so there is nothing to do here and
      // usually nothing left running to do it in.
    } catch (error) {
      console.warn('useAppUpdate: install failed', error);
      // The downloaded package could not be installed, so it is worth nothing. Dropping it means
      // the next attempt fetches a fresh one rather than retrying a package Android has refused.
      await Updater.clearDownload();
      setFailedAttempts(attempts => attempts + 1);
      setStage(UPDATE_STAGE.RETRYING);
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
      await install();
    } catch (error) {
      console.warn('useAppUpdate: download failed', error);
      setFailedAttempts(attempts => attempts + 1);
      setStage(UPDATE_STAGE.RETRYING);
    }
  }, [packageUrl, block, install]);

  /** Asks for the notification permission, which the update proceeds without if refused. */
  const requestNotificationPermission = useCallback(async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) return;
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    } catch (error) {
      console.warn('useAppUpdate: could not ask for notification permission', error);
    }
  }, []);

  const begin = useCallback(async () => {
    if (!packageUrl) return;

    if (await hasInstalledUpdateAndStillOutOfDate()) {
      block(UPDATE_BLOCKER.STILL_OUT_OF_DATE);
      return;
    }

    const status = await Updater.getStatus();
    if (!status.canInstallPackages) {
      setStage(UPDATE_STAGE.NEEDS_PERMISSION);
      return;
    }

    if (!status.canPostNotifications) {
      await requestNotificationPermission();
    }

    if (status.hasCompletedDownload) {
      await install();
      return;
    }
    await download();
  }, [packageUrl, block, download, install, requestNotificationPermission]);

  // Start as soon as an outstanding update is known, and carry on from whatever the device left
  // behind: a granted permission, a partial download, or a package ready to install.
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

  const tryAgainNow = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    download();
  }, [download]);

  const grantPermission = useCallback(async () => {
    setPermissionAsks(asks => asks + 1);
    await Updater.openInstallPermissionSettings();
  }, []);

  // Granting the permission happens in Android's settings, so whether it was granted can only be
  // known once the user comes back. A second return without it is taken as a refusal.
  useEffect(() => {
    if (stage !== UPDATE_STAGE.NEEDS_PERMISSION || !isForeground || permissionAsks === 0) return;
    Updater.getStatus().then(status => {
      if (status.canInstallPackages) {
        setStage(UPDATE_STAGE.CHECKING);
      } else if (permissionAsks >= 2) {
        block(UPDATE_BLOCKER.PERMISSION_REFUSED);
      }
    });
  }, [stage, isForeground, permissionAsks, block]);

  const offerManualUrl =
    blocker !== null || shouldOfferManualFallback(failedAttempts) ? updateUrl : null;

  return {
    isUpdateRequired: Boolean(updateUrl),
    stage,
    progress,
    blocker,
    manualUrl: offerManualUrl,
    tryAgainNow,
    grantPermission,
  };
};
