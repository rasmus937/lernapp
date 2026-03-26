const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, 'android');
const sdkPath = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');

console.log('Building APK...');
console.log('SDK:', sdkPath);

const javaHome = 'C:\\Program Files\\Android\\Android Studio\\jbr';
execSync(path.join(androidDir, 'gradlew.bat') + ' assembleDebug', {
  cwd: androidDir,
  stdio: 'inherit',
  env: { ...process.env, ANDROID_HOME: sdkPath, JAVA_HOME: javaHome }
});

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
console.log('\nAPK ready:', apkPath);
