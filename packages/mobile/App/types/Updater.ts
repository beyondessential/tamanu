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

/**
 * What the update banner is reporting. Staff keep working throughout; none of these block the app.
 */
export const UPDATE_STAGE = {
  /** Checking what the device allows and what is already downloaded. */
  CHECKING: 'checking',
  DOWNLOADING: 'downloading',
  /** A download attempt failed; the next one is waiting out its gap. */
  RETRYING: 'retrying',
  /** The device does not allow Tamanu to install apps, so the banner asks for it. */
  NEEDS_PERMISSION: 'needsPermission',
  /** The package is downloaded and waiting for staff to choose to install it. */
  READY: 'ready',
  /** Staff have confirmed, and Android has the package. */
  INSTALLING: 'installing',
  /** Android would not install the package. */
  INSTALL_FAILED: 'installFailed',
  /** Retrying cannot help: no space, or an update that did not satisfy the server. */
  BLOCKED: 'blocked',
} as const;

export type UpdateStage = (typeof UPDATE_STAGE)[keyof typeof UPDATE_STAGE];

/** Why the update cannot proceed on its own. */
export const UPDATE_BLOCKER = {
  NOT_ENOUGH_SPACE: 'notEnoughSpace',
  REPEATED_FAILURES: 'repeatedFailures',
  STILL_OUT_OF_DATE: 'stillOutOfDate',
} as const;

export type UpdateBlocker = (typeof UPDATE_BLOCKER)[keyof typeof UPDATE_BLOCKER];
