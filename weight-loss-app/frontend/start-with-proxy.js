process.env.GLOBAL_AGENT_HTTP_PROXY = 'http://127.0.0.1:7897';
process.env.ANDROID_HOME = 'D:\\App\\android-sdk';
process.env.JAVA_HOME = 'D:\\App\\jdk-17.0.13+11';

try {
  require('C:\\Users\\sevenstar\\AppData\\Roaming\\npm\\node_modules\\global-agent\\index.js');
  global.GLOBAL_AGENT = global;
  require('C:\\Users\\sevenstar\\AppData\\Roaming\\npm\\node_modules\\global-agent\\bootstrap.js');
  console.log('Proxy configured via global-agent');
} catch (e) {
  console.log('global-agent not available, trying direct approach');
}

const { execSync, spawn } = require('child_process');

const child = spawn('npx', ['expo', 'start', '--android'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

child.on('exit', (code) => {
  process.exit(code);
});
