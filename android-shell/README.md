# Continuum Android Shell

Tiny Android spike for headset-button testing.

It loads Continuum in a locked-down WebView:

```text
https://peter.tail33843e.ts.net/continuum?debug=1
```

The native layer owns an Android `MediaSession`. When it receives a media/headset button, it calls:

```js
window.ContinuumNativeBridge?.mediaButton(action)
```

## Build

```bash
ANDROID_HOME="$HOME/android-sdk" ANDROID_SDK_ROOT="$HOME/android-sdk" ./android-shell/build-apk.sh
```

## Install

```bash
$HOME/android-sdk/platform-tools/adb install --no-incremental -r android-shell/continuum-shell-debug.apk
```

If Samsung blocks ADB installs:

```bash
$HOME/android-sdk/platform-tools/adb shell settings put global verifier_verify_adb_installs 0
$HOME/android-sdk/platform-tools/adb shell settings put global package_verifier_enable 0
```

Then retry the install.

## Check Active Session

```bash
$HOME/android-sdk/platform-tools/adb shell dumpsys media_session
```

Look for:

```text
ContinuumCapture com.continuum.shell/ContinuumCapture
active=true
state=PLAYING
```

## Native Auth Flow

The WebView adds `ContinuumShell` to its user agent. The frontend uses that to request:

```text
continuum://auth-callback
```

The shell receives that deep link, converts it back to the trusted Continuum URL, and loads the
callback into the WebView.

Supabase Auth must allow this redirect URL:

```text
continuum://auth-callback
```

Google login itself opens in Chrome, not inside WebView.

## Bluetooth Route Probe

On startup/resume the shell requests Android's Bluetooth SCO communication route. The top native
strip shows the result, for example:

```text
native shell: resume: bt sco accepted · route bt_sco soundcore AeroFit 2
```

That means Android has accepted the headset as the active communication route. It does not prove
that headset button events are delivered; media buttons are a separate Android media-session path.

## Media Button Probe

The shell now starts a foreground media service and registers an explicit media-button receiver.
Android reports the receiver in `dumpsys media_session`.

Synthetic ADB media keys reach the app:

```bash
adb shell input keyevent KEYCODE_MEDIA_PLAY_PAUSE
```

The AeroFit 2 physical button still did not appear in the app logs in the latest test.
