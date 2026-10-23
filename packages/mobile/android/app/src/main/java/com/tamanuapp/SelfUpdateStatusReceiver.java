package com.tamanuapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;

// SPIKE: records how Android responded to the install session
public class SelfUpdateStatusReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);

        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            // Not silent: Android wants the user to confirm, so show its prompt
            SelfUpdateModule.recordStatus(context, "PENDING_USER_ACTION (not silent)");
            // Typed getParcelableExtra is API 33+; minSdk is 31
            Intent confirmIntent = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirmIntent != null) {
                confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(confirmIntent);
            }
            return;
        }

        String name = status == PackageInstaller.STATUS_SUCCESS ? "SUCCESS" : "FAILURE " + status;
        SelfUpdateModule.recordStatus(context, name + (message == null ? "" : ": " + message));
    }
}
