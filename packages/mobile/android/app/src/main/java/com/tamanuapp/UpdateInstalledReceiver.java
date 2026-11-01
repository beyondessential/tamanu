package com.tamanuapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Android delivers MY_PACKAGE_REPLACED to an app once it has been updated, with the app itself left
 * closed. This is the only moment at which anything of Tamanu's runs after an update, so the
 * notification that brings the user back is posted from here rather than from the app.
 */
public class UpdateInstalledReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
            return;
        }
        UpdateNotifications.notifyUpdateInstalled(context);
    }
}
