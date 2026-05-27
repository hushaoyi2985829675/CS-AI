const http = require('http');
const https = require('https');
const { URL } = require('url');
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new (require('https').Agent)({ keepAlive: true });

const originalHttpRequest = http.request;
const originalHttpsRequest = https.request;

function isExternal(hostname) {
  return !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.startsWith('192.168') && !hostname.startsWith('10.');
}

function proxyRequest(mod, originalFn) {
  return function (options, callback) {
    const hostname = typeof options === 'string' ? new URL(options).hostname : options.hostname;
    if (isExternal(hostname)) {
      const proxyOptions = {
        hostname: '127.0.0.1',
        port: 7897,
        method: 'CONNECT',
        path: hostname + ':443',
      };
      const proxyReq = http.request(proxyOptions);
      proxyReq.on('connect', (res, socket) => {
        const tlsSocket = require('tls').connect({ socket, servername: hostname, rejectUnauthorized: false }, () => {
          const opts = typeof options === 'string' ? new URL(options) : { ...options, host: undefined, hostname: undefined, agent: false, socket: tlsSocket };
          const req = https.request(opts, callback);
          if (typeof options !== 'string' && options.body) req.write(options.body);
          req.end();
        });
      });
      proxyReq.end();
      return proxyReq;
    }
    return originalFn.call(mod, options, callback);
  };
}

http.request = proxyRequest(http, originalHttpRequest);
https.request = proxyRequest(https, originalHttpsRequest);

process.env.ANDROID_HOME = 'D:\\App\\android-sdk';
process.env.JAVA_HOME = 'D:\\App\\jdk-17.0.13+11';
process.env.EXPO_OFFLINE = '1';

try {
  require('child_process').execFileSync('adb', ['reverse', 'tcp:8081', 'tcp:8081'], {
    stdio: 'ignore',
    env: { ...process.env, PATH: process.env.PATH + ';D:\\App\\android-sdk\\platform-tools' },
  });
  console.log('[ADB] Port 8081 reversed');
} catch (e) {
  console.log('[ADB] reverse failed');
}

const { spawn } = require('child_process');
const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--android'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code || 0));
