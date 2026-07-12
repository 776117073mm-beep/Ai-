import { spawn } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

const web = spawn(npmCommand, ['run', 'dev:web'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: false,
  env: { ...process.env }
});

const server = spawn(npmCommand, ['run', 'dev:server'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: false,
  env: { ...process.env }
});

const children = [web, server];

function stopAll(signal) {
  for (const child of children) {
    if (!child.killed && child.pid) {
      try {
        child.kill(signal);
      } catch {
        // ignore
      }
    }
  }
}

function handleExit(code, signal) {
  stopAll(signal || 'SIGTERM');
  process.exit(code ?? 0);
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (code === 0) return;
    handleExit(code ?? 1, signal);
  });
}

process.on('SIGINT', () => handleExit(0, 'SIGINT'));
process.on('SIGTERM', () => handleExit(0, 'SIGTERM'));
