package com.tamanuapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

/**
 * The notification that brings the user back into Tamanu after Android has installed an update and
 * left the app closed.
 */
public class UpdateNotifications {

    private static final String CHANNEL_ID = "tamanu-updates";
    private static final int NOTIFICATION_ID = 1;

    public static void createChannel(Context context) {
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.update_notification_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(context.getString(R.string.update_notification_channel_description));
        NotificationManagerCompat.from(context).createNotificationChannel(channel);
    }

    public static boolean canPostNotifications(Context context) {
        return ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Posts the "Tamanu has been updated" notification. Does nothing where the permission was
     * refused: the update has already succeeded by this point, and the user was warned on screen
     * that the app would close, so a missing notification costs them a tap on the icon rather than
     * the update.
     */
    public static void notifyUpdateInstalled(Context context) {
        if (!canPostNotifications(context)) {
            return;
        }

        createChannel(context);

        Intent launchIntent = context.getPackageManager()
            .getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) {
            return;
        }
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(context.getString(R.string.update_notification_title))
            .setContentText(context.getString(R.string.update_notification_body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build();

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification);
    }
}
