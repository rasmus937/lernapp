const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, 'android');
const sdkPath = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');

console.log('Building APK...');
console.log('SDK:', sdkPath);

const javaHome = 'C:\\Program Files\\Android\\Android Studio\\jbr';

// Stop any running Gradle daemon first
try {
  execSync(path.join(androidDir, 'gradlew.bat') + ' --stop', {
    cwd: androidDir, stdio: 'inherit',
    env: { ...process.env, ANDROID_HOME: sdkPath, JAVA_HOME: javaHome }
  });
} catch (e) { /* ignore */ }

// Clean corrupt cache
const cacheDir = path.join(process.env.USERPROFILE, '.gradle', 'caches', '8.14.3', 'groovy-dsl');
try { require('fs').rmSync(cacheDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }

execSync(path.join(androidDir, 'gradlew.bat') + ' clean assembleDebug --no-daemon', {
  cwd: androidDir,
  stdio: 'inherit',
  env: { ...process.env, ANDROID_HOME: sdkPath, JAVA_HOME: javaHome }
});

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
console.log('\nAPK ready:', apkPath);
