#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
BUILD_TOOLS="$SDK_DIR/build-tools/35.0.1"
PLATFORM="$SDK_DIR/platforms/android-35/android.jar"
JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"

export JAVA_HOME
export PATH="$JAVA_HOME/bin:$BUILD_TOOLS:$SDK_DIR/platform-tools:$PATH"

BUILD_DIR="$ROOT_DIR/build"
KEYSTORE="$ROOT_DIR/debug.keystore"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/compiled" "$BUILD_DIR/classes" "$BUILD_DIR/dex"

if [ ! -f "$PLATFORM" ]; then
  echo "Missing $PLATFORM"
  echo "Install with: ANDROID_HOME=$SDK_DIR ANDROID_SDK_ROOT=$SDK_DIR sdkmanager --install 'platforms;android-35' 'build-tools;35.0.1' 'platform-tools'"
  exit 1
fi

if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair \
    -keystore "$KEYSTORE" \
    -storepass android \
    -keypass android \
    -alias androiddebugkey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Android Debug,O=Continuum,C=GB" >/dev/null
fi

aapt2 compile --dir "$ROOT_DIR/res" -o "$BUILD_DIR/compiled/resources.zip"
aapt2 link \
  -I "$PLATFORM" \
  --manifest "$ROOT_DIR/AndroidManifest.xml" \
  -o "$BUILD_DIR/unsigned.apk" \
  "$BUILD_DIR/compiled/resources.zip" \
  --java "$BUILD_DIR/generated"

javac \
  --release 17 \
  -classpath "$PLATFORM" \
  -d "$BUILD_DIR/classes" \
  $(find "$BUILD_DIR/generated" "$ROOT_DIR/src" -name '*.java' | sort)

d8 \
  --lib "$PLATFORM" \
  --output "$BUILD_DIR/dex" \
  $(find "$BUILD_DIR/classes" -name '*.class' | sort)

cp "$BUILD_DIR/unsigned.apk" "$BUILD_DIR/with-dex.apk"
cd "$BUILD_DIR/dex"
zip -qr "$BUILD_DIR/with-dex.apk" classes.dex
cd "$ROOT_DIR"

zipalign -f 4 "$BUILD_DIR/with-dex.apk" "$BUILD_DIR/aligned.apk"
apksigner sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$ROOT_DIR/continuum-shell-debug.apk" \
  "$BUILD_DIR/aligned.apk"

apksigner verify "$ROOT_DIR/continuum-shell-debug.apk"
echo "$ROOT_DIR/continuum-shell-debug.apk"
