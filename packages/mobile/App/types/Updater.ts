export interface UpdaterStatus {
  /** Whether the device allows Tamanu to install apps. */
  canInstallPackages: boolean;
  /** Whether Tamanu may post the notification that brings the user back after an install. */
  canPostNotifications: boolean;
  /** Whether a complete package is already downloaded and ready to install. */
  hasCompletedDownload: boolean;
  /** Bytes already on disk, whether from a partial download or a complete one. */
  downloadedBytes: number;
}

export interface UpdateProgress {
  downloadedBytes: number;
  /** The size the server declared, or -1 where it declared none. */
  totalBytes: number;
}

export interface UpdaterModule {
  getStatus(): Promise<UpdaterStatus>;

  /** Free space in the directory the package downloads into. */
  getFreeDiskBytes(): Promise<number>;

  /**
   * The size the server declares for the package, without downloading it. Resolves to -1 where the
   * server declares no size.
   */
  getPackageSize(url: string): Promise<number>;

  /** Opens the Android settings screen that allows Tamanu to install apps. */
  openInstallPermissionSettings(): Promise<void>;

  /**
   * Downloads the package, resuming a partial download where one is present. Resolves with the
   * completed package's size, and reports progress through the `tamanuUpdateProgress` event.
   */
  startDownload(url: string): Promise<number>;

  cancelDownload(): Promise<void>;

  /** Removes the downloaded package and any partial download. */
  clearDownload(): Promise<void>;

  /**
   * Hands the downloaded package to Android. A successful install replaces the app and closes it,
   * so this rarely resolves in the running process.
   */
  installDownloadedPackage(): Promise<void>;
}

/** The stage the update screen is showing. */
export const UPDATE_STAGE = {
  /** Checking what the device allows and what is already downloaded. */
  CHECKING: 'checking',
  /** The device does not allow Tamanu to install apps, and the user has been asked once. */
  NEEDS_PERMISSION: 'needsPermission',
  DOWNLOADING: 'downloading',
  /** A download attempt failed; the next one is waiting out its gap. */
  RETRYING: 'retrying',
  INSTALLING: 'installing',
  /** Retrying cannot help: no space, a refused permission, or an update that did not take. */
  BLOCKED: 'blocked',
} as const;

export type UpdateStage = (typeof UPDATE_STAGE)[keyof typeof UPDATE_STAGE];

/** Why the update cannot proceed without the user doing something. */
export const UPDATE_BLOCKER = {
  NOT_ENOUGH_SPACE: 'notEnoughSpace',
  PERMISSION_REFUSED: 'permissionRefused',
  REPEATED_FAILURES: 'repeatedFailures',
  STILL_OUT_OF_DATE: 'stillOutOfDate',
} as const;

export type UpdateBlocker = (typeof UPDATE_BLOCKER)[keyof typeof UPDATE_BLOCKER];
