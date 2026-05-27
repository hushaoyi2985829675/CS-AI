process.env.EXPO_HOME = "D:\\App\\.expo";

const { spawn } = require("child_process");

const child = spawn("npx expo start --web --port 19006", {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

child.on("exit", (code) => {
  process.exit(code);
});
