package com.tamanuapp;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.provider.Settings;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Downloads and installs the Tamanu update package.
 *
 * Downloading happens off the main thread and reports progress through the
 * {@code tamanuUpdateProgress} event. Installing hands the package to Android's package installer,
 * which replaces the app and closes it; where the device has not yet confirmed an install from
 * Tamanu, Android asks the user first and the confirmation is surfaced rather than suppressed.
 */
public class UpdaterModule extends ReactContextBaseJavaModule {

    private static final String PROGRESS_EVENT = "tamanuUpdateProgress";
    private static final String INSTALL_RESULT_ACTION = "com.tamanuapp.INSTALL_RESULT";
    private static final int PROGRESS_EVENT_INTERVAL_MS = 250;

    private final UpdateDownloader downloader;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private BroadcastReceiver installResultReceiver;
    private Promise pendingInstallPromise;

    public UpdaterModule(ReactApplicationContext context) {
        super(context);
        this.downloader = new UpdateDownloader(context);
    }

    @Override
    public String getName() {
        return "TamanuUpdater";
    }

    private boolean canInstallPackages() {
        return getReactApplicationContext().getPackageManager().canRequestPackageInstalls();
    }

    @ReactMethod
    public void getStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();
            status.putBoolean("canInstallPackages", canInstallPackages());
            status.putBoolean("canPostNotifications",
                UpdateNotifications.canPostNotifications(getReactApplicationContext()));
            status.putBoolean("hasCompletedDownload", downloader.hasCompletedDownload());
            status.putDouble("downloadedBytes", downloader.downloadedBytes());
            promise.resolve(status);
        } catch (Exception e) {
            promise.reject("UPDATE_STATUS_ERROR", "Failed to read update status", e);
        }
    }

    @ReactMethod
    public void getFreeDiskBytes(Promise promise) {
        try {
            promise.resolve((double) getReactApplicationContext().getFilesDir().getFreeSpace());
        } catch (Exception e) {
            promise.reject("FREE_SPACE_ERROR", "Failed to read free disk space", e);
        }
    }

    /**
     * Opens the Android settings screen that allows Tamanu to install apps. The app cannot grant
     * this itself; the user has to turn it on and come back.
     */
    @ReactMethod
    public void openInstallPermissionSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                .setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("INSTALL_SETTINGS_ERROR", "Failed to open the install permission settings", e);
        }
    }

    /**
     * The size the server declares for the package, so free space can be checked before the
     * download starts rather than after it has filled the disk.
     */
    @ReactMethod
    public void getPackageSize(String url, Promise promise) {
        executor.execute(() -> {
            try {
                promise.resolve((double) downloader.declaredSize(url));
            } catch (Exception e) {
                promise.reject("PACKAGE_SIZE_FAILED", e.getMessage(), e);
            }
        });
    }

    @ReactMethod
    public void startDownload(String url, Promise promise) {
        executor.execute(() -> {
            try {
                final long[] lastEmittedAt = { 0 };
                File file = downloader.download(url, (downloadedBytes, totalBytes) -> {
                    long now = System.currentTimeMillis();
                    boolean isComplete = totalBytes > 0 && downloadedBytes == totalBytes;
                    if (!isComplete && now - lastEmittedAt[0] < PROGRESS_EVENT_INTERVAL_MS) {
                        return;
                    }
                    lastEmittedAt[0] = now;
                    emitProgress(downloadedBytes, totalBytes);
                });
                promise.resolve((double) file.length());
            } catch (UpdateDownloader.TruncatedDownloadException e) {
                promise.reject("DOWNLOAD_TRUNCATED", e.getMessage(), e);
            } catch (Exception e) {
                promise.reject("DOWNLOAD_FAILED", e.getMessage(), e);
            }
        });
    }

    private void emitProgress(long downloadedBytes, long totalBytes) {
        WritableMap progress = Arguments.createMap();
        progress.putDouble("downloadedBytes", downloadedBytes);
        progress.putDouble("totalBytes", totalBytes);
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(PROGRESS_EVENT, progress);
    }

    @ReactMethod
    public void cancelDownload(Promise promise) {
        downloader.cancel();
        promise.resolve(null);
    }

    @ReactMethod
    public void clearDownload(Promise promise) {
        try {
            downloader.clear();
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("CLEAR_DOWNLOAD_ERROR", "Failed to remove the downloaded package", e);
        }
    }

    /**
     * Hands the downloaded package to Android. On success the app is replaced and this process is
     * killed, so the promise only ever resolves to report that the install is under way or that
     * Android is asking the user to confirm it.
     */
    @ReactMethod
    public void installDownloadedPackage(Promise promise) {
        File packageFile = downloader.completeFile();
        if (!packageFile.exists()) {
            promise.reject("NO_PACKAGE", "There is no downloaded package to install");
            return;
        }
        if (!canInstallPackages()) {
            promise.reject("INSTALL_NOT_PERMITTED", "This device does not allow Tamanu to install apps");
            return;
        }

        registerInstallResultReceiver();
        pendingInstallPromise = promise;

        // Copying the package into the install session is as large a read and write as the
        // download was, so it stays off the calling thread.
        executor.execute(() -> {
            try {
                PackageInstaller installer = getReactApplicationContext()
                    .getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(
                    PackageInstaller.SessionParams.MODE_FULL_INSTALL
                );
                params.setAppPackageName(getReactApplicationContext().getPackageName());

                int sessionId = installer.createSession(params);
                try (PackageInstaller.Session session = installer.openSession(sessionId)) {
                    writePackageIntoSession(session, packageFile);
                    session.commit(buildInstallResultSender(sessionId));
                }
            } catch (Exception e) {
                pendingInstallPromise = null;
                promise.reject("INSTALL_FAILED", "Failed to start installing the update", e);
            }
        });
    }

    private void writePackageIntoSession(PackageInstaller.Session session, File packageFile)
            throws IOException {
        try (InputStream input = new FileInputStream(packageFile);
             OutputStream output = session.openWrite("tamanu", 0, packageFile.length())) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            session.fsync(output);
        }
    }

    private PendingIntent buildInstallResultPendingIntent(int sessionId) {
        Intent intent = new Intent(INSTALL_RESULT_ACTION).setPackage(
            getReactApplicationContext().getPackageName()
        );
        return PendingIntent.getBroadcast(
            getReactApplicationContext(),
            sessionId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
    }

    private android.content.IntentSender buildInstallResultSender(int sessionId) {
        return buildInstallResultPendingIntent(sessionId).getIntentSender();
    }

    private void registerInstallResultReceiver() {
        if (installResultReceiver != null) {
            return;
        }
        installResultReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                handleInstallResult(intent);
            }
        };
        getReactApplicationContext().registerReceiver(
            installResultReceiver,
            new IntentFilter(INSTALL_RESULT_ACTION),
            Context.RECEIVER_NOT_EXPORTED
        );
    }

    private void handleInstallResult(Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS,
            PackageInstaller.STATUS_FAILURE);
        Promise promise = pendingInstallPromise;

        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            // The device has not confirmed an install from Tamanu before, so Android asks the user
            // once. Later updates on this device install without a prompt.
            Intent confirmation = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirmation != null) {
                confirmation.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(confirmation);
            }
            return;
        }

        pendingInstallPromise = null;
        if (promise == null) {
            return;
        }
        if (status == PackageInstaller.STATUS_SUCCESS) {
            promise.resolve(null);
            return;
        }
        String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
        promise.reject("INSTALL_FAILED", message != null ? message : "The update could not be installed");
    }

    @Override
    public void invalidate() {
        if (installResultReceiver != null) {
            try {
                getReactApplicationContext().unregisterReceiver(installResultReceiver);
            } catch (IllegalArgumentException ignored) {
                // already unregistered
            }
            installResultReceiver = null;
        }
        executor.shutdownNow();
        super.invalidate();
    }
}
