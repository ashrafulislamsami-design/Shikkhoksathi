const { spawn } = require('child_process');
const path = require('path');

// ANSI Color Codes
const COLOR_SYSTEM = '\x1b[33m';   // Yellow
const COLOR_BACKEND = '\x1b[32m';  // Green
const COLOR_FRONTEND = '\x1b[36m'; // Cyan
const COLOR_RESET = '\x1b[0m';

function log(prefix, color, message) {
  const formattedLines = message
    .toString()
    .trim()
    .split('\n')
    .map(line => `${color}[${prefix}]${COLOR_RESET} ${line}`);
  
  formattedLines.forEach(line => {
    console.log(line);
  });
}

function runService(name, dir, command, args, color) {
  const isWindows = process.platform === 'win32';
  
  log('System', COLOR_SYSTEM, `Starting ${name} in ${dir}...`);
  
  const child = spawn(command, args, {
    cwd: path.resolve(__dirname, dir),
    stdio: 'pipe',
    shell: true
  });

  child.stdout.on('data', (data) => {
    log(name, color, data);
  });

  child.stderr.on('data', (data) => {
    log(name, color, data);
  });

  child.on('close', (code) => {
    log('System', COLOR_SYSTEM, `${name} service exited with code ${code}`);
    process.exit(code || 0);
  });

  return child;
}

const backend = runService('Backend', 'backend', 'npm', ['run', 'dev'], COLOR_BACKEND);
const frontend = runService('Frontend', 'student-ui', 'npm', ['start'], COLOR_FRONTEND);

// Handle clean shutdown
const cleanExit = () => {
  log('System', COLOR_SYSTEM, '\nShutting down backend and frontend services...');
  
  if (backend) {
    backend.kill('SIGINT');
  }
  if (frontend) {
    frontend.kill('SIGINT');
  }
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);
