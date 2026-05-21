package com.continuum.shell;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.view.KeyEvent;

public final class ContinuumMediaService extends Service {
    private static final String TAG = "ContinuumShell";
    private static final String CHANNEL_ID = "continuum-capture";
    private static final String ACTION_MEDIA_BUTTON = "com.continuum.shell.MEDIA_BUTTON";
    private static final String EXTRA_ACTION = "action";

    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(42, buildNotification("Waiting for headset button"));
        setupMediaSession();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_MEDIA_BUTTON.equals(intent.getAction())) {
            String action = intent.getStringExtra(EXTRA_ACTION);
            if (action != null) {
                handleMediaButton(action);
            }
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }

    static void sendMediaButton(Context context, String action) {
        Intent intent = new Intent(context, ContinuumMediaService.class);
        intent.setAction(ACTION_MEDIA_BUTTON);
        intent.putExtra(EXTRA_ACTION, action);
        context.startService(intent);
    }

    private void setupMediaSession() {
        mediaSession = new MediaSession(this, "ContinuumForegroundCapture");
        mediaSession.setMediaButtonReceiver(MediaButtonReceiver.pendingIntent(this));
        mediaSession.setFlags(
            MediaSession.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                KeyEvent event = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                if (event != null && event.getAction() == KeyEvent.ACTION_UP) {
                    handleMediaButton("service-key-" + event.getKeyCode());
                    return true;
                }
                return super.onMediaButtonEvent(mediaButtonIntent);
            }

            @Override
            public void onPlay() {
                handleMediaButton("service-play");
            }

            @Override
            public void onPause() {
                handleMediaButton("service-pause");
            }
        });
        mediaSession.setPlaybackState(new PlaybackState.Builder()
            .setActions(
                PlaybackState.ACTION_PLAY |
                PlaybackState.ACTION_PAUSE |
                PlaybackState.ACTION_PLAY_PAUSE |
                PlaybackState.ACTION_SKIP_TO_NEXT |
                PlaybackState.ACTION_SKIP_TO_PREVIOUS
            )
            .setState(PlaybackState.STATE_PLAYING, 0, 1)
            .build());
        mediaSession.setActive(true);
    }

    private void handleMediaButton(String action) {
        Log.d(TAG, "media service: " + action);
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(42, buildNotification(action));
    }

    private Notification buildNotification(String text) {
        Intent launchIntent = new Intent(this, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, flags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        return builder
            .setContentTitle("Continuum Shell")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Continuum capture",
            NotificationManager.IMPORTANCE_LOW
        );
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.createNotificationChannel(channel);
    }
}
