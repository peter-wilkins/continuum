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
