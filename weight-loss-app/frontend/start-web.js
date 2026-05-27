process.env.EXPO_HOME = "D:\\App\\.expo";
process.env.CI = "true";

const { execSync, spawn } = require("child_process");

const child = spawn("npx", ["expo", "start", "--web"], {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

child.on("exit", (code) => {
  process.exit(code);
});
