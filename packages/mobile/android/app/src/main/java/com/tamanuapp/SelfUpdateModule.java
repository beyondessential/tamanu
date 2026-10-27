package com.tamanuapp;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

// SPIKE: tests whether the app can install an update of itself without user action (Android 12+)
public class SelfUpdateModule extends ReactContextBaseJavaModule {

    static final String TAG = "SelfUpdate";
    static final String PREFS = "selfUpdateSpike";
    static final String STATUS_KEY = "lastStatus";

    public SelfUpdateModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "SelfUpdate";
    }

    @ReactMethod
    public void canRequestPackageInstalls(Promise promise) {
        promise.resolve(getReactApplicationContext().getPackageManager().canRequestPackageInstalls());
    }

    @ReactMethod
    public void openInstallPermissionSettings() {
        Context context = getReactApplicationContext();
        Intent intent = new Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + context.getPackageName())
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    @ReactMethod
    public void getLastStatus(Promise promise) {
        promise.resolve(prefs(getReactApplicationContext()).getString(STATUS_KEY, null));
    }

    @ReactMethod
    public void installApk(String apkPath, Promise promise) {
        Context context = getReactApplicationContext();
        PackageInstaller installer = context.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params =
            new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);

        try {
            int sessionId = installer.createSession(params);
            try (PackageInstaller.Session session = installer.openSession(sessionId)) {
                File apk = new File(apkPath);
                try (InputStream in = new FileInputStream(apk);
                     OutputStream out = session.openWrite("update.apk", 0, apk.length())) {
                    byte[] buffer = new byte[65536];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                    }
                    session.fsync(out);
                }

                Intent statusIntent = new Intent(context, SelfUpdateStatusReceiver.class);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    sessionId,
                    statusIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
                );
                recordStatus(context, "COMMITTED session " + sessionId);
                session.commit(pendingIntent.getIntentSender());
            }
            promise.resolve(null);
        } catch (Exception e) {
            recordStatus(context, "ERROR " + e.getMessage());
            promise.reject("SELF_UPDATE_ERROR", e);
        }
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void recordStatus(Context context, String status) {
        Log.i(TAG, status);
        prefs(context).edit().putString(STATUS_KEY, status).commit();
    }
}
