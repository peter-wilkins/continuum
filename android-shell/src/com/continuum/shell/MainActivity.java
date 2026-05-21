package com.continuum.shell;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.util.Log;

import org.json.JSONObject;

public final class MainActivity extends Activity {
    private static final String TAG = "ContinuumShell";
    private static final String TRUSTED_HOST = "peter.tail33843e.ts.net";
    private static final String START_URL = "https://" + TRUSTED_HOST + "/continuum?debug=1";

    private WebView webView;
    private TextView statusView;
    private MediaSession mediaSession;
    private int mediaButtonCount = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestRecordAudioPermission();
        setupLayout();
        setupMediaSession();
        webView.loadUrl(START_URL);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mediaSession != null) {
            mediaSession.setActive(true);
        }
    }

    @Override
    protected void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_UP && isMediaKey(event.getKeyCode())) {
            handleMediaButton("activity-key-" + event.getKeyCode());
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void requestRecordAudioPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) return;
        requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, 10);
    }

    private void setupLayout() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(255, 253, 248));

        statusView = new TextView(this);
        statusView.setGravity(Gravity.CENTER_VERTICAL);
        statusView.setTextColor(Color.rgb(28, 28, 26));
        statusView.setBackgroundColor(Color.rgb(244, 239, 228));
        statusView.setPadding(18, 10, 18, 10);
        statusView.setText("native shell: waiting for headset button");
        root.addView(statusView, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new TrustedWebViewClient());
        webView.setWebChromeClient(new TrustedWebChromeClient());
        root.addView(webView, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1
        ));

        setContentView(root);
    }

    private void setupMediaSession() {
        mediaSession = new MediaSession(this, "ContinuumCapture");
        mediaSession.setFlags(
            MediaSession.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                KeyEvent event = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                if (event != null && event.getAction() == KeyEvent.ACTION_UP) {
                    handleMediaButton("key-" + event.getKeyCode());
                    return true;
                }
                return super.onMediaButtonEvent(mediaButtonIntent);
            }

            @Override
            public void onPlay() {
                handleMediaButton("play");
            }

            @Override
            public void onPause() {
                handleMediaButton("pause");
            }

            @Override
            public void onSkipToNext() {
                handleMediaButton("next");
            }

            @Override
            public void onSkipToPrevious() {
                handleMediaButton("previous");
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
        mediaButtonCount += 1;
        String message = "native shell: " + action + " (" + mediaButtonCount + ")";
        Log.d(TAG, message);
        statusView.setText(message);
        String javascript = "window.ContinuumNativeBridge?.mediaButton(" + JSONObject.quote(action) + ")";
        webView.post(() -> webView.evaluateJavascript(javascript, null));
    }

    private boolean isMediaKey(int keyCode) {
        return keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PLAY ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE ||
            keyCode == KeyEvent.KEYCODE_MEDIA_NEXT ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS ||
            keyCode == KeyEvent.KEYCODE_HEADSETHOOK;
    }

    private final class TrustedWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            return !"https".equals(uri.getScheme()) || !TRUSTED_HOST.equals(uri.getHost());
        }
    }

    private final class TrustedWebChromeClient extends WebChromeClient {
        @Override
        public void onPermissionRequest(PermissionRequest request) {
            Uri origin = request.getOrigin();
            if (!"https".equals(origin.getScheme()) || !TRUSTED_HOST.equals(origin.getHost())) {
                request.deny();
                return;
            }

            request.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
        }
    }
}
