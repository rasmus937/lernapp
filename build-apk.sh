#!/bin/bash
export JAVA_HOME="/mnt/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="/mnt/c/Users/rasmu/AppData/Local/Android/Sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
cd /mnt/c/Users/rasmu/Documents/LernApp/android
rm -rf app/build/outputs/apk
chmod +x gradlew
./gradlew clean assembleDebug --no-daemon 2>&1
echo ""
echo "=== BUILD RESULT ==="
if [ -f app/build/outputs/apk/debug/app-debug.apk ]; then
  ls -lh app/build/outputs/apk/debug/app-debug.apk
  echo "APK ready!"
else
  echo "BUILD FAILED"
fi
