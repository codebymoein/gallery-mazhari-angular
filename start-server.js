const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.NG_CLI_ANALYTICS = 'off';
process.env.NG_DISABLE_VERSION_CHECK = 'true';

console.log('Starting Angular Development Server...');
console.log('Server running on: http://localhost:4200\n');

// Spawn ng serve process
const ngServe = spawn('ng', ['serve', '--port', '4200', '--poll', '2000'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

ngServe.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

ngServe.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
