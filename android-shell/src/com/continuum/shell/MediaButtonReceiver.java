package com.continuum.shell;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import android.view.KeyEvent;

public final class MediaButtonReceiver extends BroadcastReceiver {
    private static final String TAG = "ContinuumShell";

    @Override
    public void onReceive(Context context, Intent intent) {
        KeyEvent event = intent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
        if (event == null || event.getAction() != KeyEvent.ACTION_UP) return;

        String action = "receiver-key-" + event.getKeyCode();
        Log.d(TAG, "media button receiver: " + action);
        ContinuumMediaService.sendMediaButton(context, action);
    }

    static PendingIntent pendingIntent(Context context) {
        Intent intent = new Intent(Intent.ACTION_MEDIA_BUTTON);
        intent.setClass(context, MediaButtonReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, 0, intent, flags);
    }
}
