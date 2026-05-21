# Android Native Shell Experiment

## Purpose

Test one question:

> Can native Android reliably receive AeroFit 2 headset button events and toggle Continuum capture?

This is not a rewrite. Continuum remains the web UI. The native shell owns only the Android
integration that Chrome/PWA did not expose reliably.

## Current Result

- Android Chrome in-app recording works.
- Android Chrome Media Session headset-button experiment did not show state changes when pressing
  the AeroFit 2 controls.
- AeroFit 2 controls can still play/pause VLC on Android after VLC has been "stopped", which
  suggests another app may retain Android media-button focus ahead of Chrome.
- Desktop Bluetooth is out of scope for this spike.

## Web Bridge

The frontend now exposes:

```js
window.ContinuumNativeBridge.mediaButton("play-pause")
```

Calling that from a native Android shell toggles the same recording path as the on-screen record
button. In debug mode, the app shows:

- whether the bridge is installed;
- native action count;
- last native action;
- timestamp.

Manual browser test:

```js
window.ContinuumNativeBridge.mediaButton("manual-test")
```

Run it from DevTools while logged in. The debug panel should increment `native bridge` action count
and recording state should toggle.

Manual phone test:

1. Open `/continuum?debug=1&headset=1`.
2. Close or force-stop media apps such as VLC.
3. Tap `Arm headset buttons`.
4. Press the headset play/pause control.
5. Check whether the headset action count increments or another app still reacts.

## Minimal Android Shell Shape

The first shell should do only this:

1. Load the Continuum URL in a locked-down `WebView`.
2. Create an active Android `MediaSession`.
3. Receive Bluetooth headset media-button callbacks.
4. Call the web bridge through `webView.evaluateJavascript(...)`.
5. Show a minimal native diagnostic overlay or log line.

It should not own transcription, auth, sync, storage, or LLM logic.

## Native Callback Sketch

```kotlin
private fun sendMediaButtonToWeb(action: String) {
    val escaped = JSONObject.quote(action)
    webView.evaluateJavascript(
        "window.ContinuumNativeBridge?.mediaButton($escaped)",
        null,
    )
}

private val sessionCallback = object : MediaSession.Callback() {
    override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
        val event = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT, KeyEvent::class.java)
        } else {
            @Suppress("DEPRECATION")
            mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT)
        }

        if (event?.action == KeyEvent.ACTION_UP) {
            sendMediaButtonToWeb("key-${event.keyCode}")
            return true
        }

        return super.onMediaButtonEvent(mediaButtonIntent)
    }
}
```

## Safety Rules

- The WebView should load only the trusted Continuum origin.
- Do not expose a broad JavaScript interface to untrusted pages.
- Prefer native-to-web `evaluateJavascript` for this spike; avoid giving arbitrary web code access
  to native APIs.
- Keep the web bridge tiny: media-button action in, recorder toggle out.

## Setup Gap

This machine currently lacks the Android toolchain:

- `java`
- `gradle`
- `adb`
- `sdkmanager`

So the next physical step is installing Android Studio or command-line Android tools, then building
the smallest APK from this design.

## References

- Android media buttons and Bluetooth headset controls:
  <https://developer.android.com/guide/topics/media-apps/mediabuttons>
- Android MediaSession:
  <https://developer.android.com/guide/topics/media/session/mediasession>
- Android WebView native API bridge:
  <https://developer.android.com/develop/ui/views/layout/webapps/native-api-access-jsbridge>
- Android audio focus:
  <https://developer.android.com/guide/topics/media-apps/audio-focus>
