const { execSync } = require('child_process');
const cwd = __dirname;

console.log('Installing Capacitor packages...');
execSync('npm install @capacitor/core @capacitor/cli @capacitor/android', { cwd, stdio: 'inherit' });

console.log('\nAdding Android platform...');
execSync('npx cap add android', { cwd, stdio: 'inherit' });

console.log('\nDone!');
