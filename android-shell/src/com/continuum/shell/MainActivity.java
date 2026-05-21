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
import android.webkit.CookieManager;
import android.webkit.ConsoleMessage;
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
    private static final String SUPABASE_AUTH_HOST = "dtwuflwgcwxygjgkvzfl.supabase.co";
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
        handleIntent(getIntent());
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mediaSession != null) {
            mediaSession.setActive(true);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
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
        webView.getSettings().setUserAgentString(
            webView.getSettings().getUserAgentString() + " ContinuumShell"
        );
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.setWebViewClient(new TrustedWebViewClient());
        webView.setWebChromeClient(new TrustedWebChromeClient());
        root.addView(webView, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1
        ));

        setContentView(root);
    }

    private void handleIntent(Intent intent) {
        Uri uri = intent == null ? null : intent.getData();
        if (uri != null && "continuum".equals(uri.getScheme()) && "auth-callback".equals(uri.getHost())) {
            String callbackUrl = "https://" + TRUSTED_HOST + "/continuum";
            String query = uri.getEncodedQuery();
            String fragment = uri.getEncodedFragment();
            if (query != null && !query.isEmpty()) {
                callbackUrl += "?" + query;
            }
            if (fragment != null && !fragment.isEmpty()) {
                callbackUrl += "#" + fragment;
            }
            Log.d(TAG, "auth callback received");
            statusView.setText("native shell: auth callback");
            webView.loadUrl(callbackUrl);
            return;
        }

        webView.loadUrl(START_URL);
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
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            Uri uri = Uri.parse(url);
            String host = uri.getHost();
            Log.d(TAG, "page started: " + safeUrlLabel(uri));
            statusView.setText("native shell: page " + (host == null ? "unknown" : host));
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!"https".equals(uri.getScheme())) {
                Log.w(TAG, "blocked non-https navigation: " + safeUrlLabel(uri));
                return true;
            }

            String host = uri.getHost();
            if (isExternalOAuthHost(host)) {
                Log.d(TAG, "opening external OAuth host: " + host);
                statusView.setText("native shell: login in browser");
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }

            if (isAllowedNavigationHost(host)) {
                statusView.setText("native shell: loading " + host);
                return false;
            }

            Log.w(TAG, "blocked untrusted navigation: " + safeUrlLabel(uri));
            statusView.setText("native shell: blocked " + host);
            return true;
        }
    }

    private String safeUrlLabel(Uri uri) {
        if (uri == null) return "unknown";
        String host = uri.getHost();
        String path = uri.getPath();
        return uri.getScheme() + "://" + (host == null ? "unknown" : host) + (path == null ? "" : path);
    }

    private boolean isAllowedNavigationHost(String host) {
        if (host == null) return false;
        return TRUSTED_HOST.equals(host) ||
            SUPABASE_AUTH_HOST.equals(host);
    }

    private boolean isExternalOAuthHost(String host) {
        if (host == null) return false;
        return "accounts.google.com".equals(host) ||
            host.endsWith(".accounts.google.com");
    }

    private final class TrustedWebChromeClient extends WebChromeClient {
        @Override
        public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
            Log.d(TAG, "web console: " + consoleMessage.message());
            return super.onConsoleMessage(consoleMessage);
        }

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
