const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MSP Platform Development Environment...\n');

// Start backend
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start frontend
console.log('🎨 Starting frontend server...');
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

frontend.on('error', (err) => {
  console.error('❌ Frontend error:', err);
});

console.log('✅ Both servers are starting...');
console.log('🌐 Frontend will be available at: http://localhost:3000');
console.log('📡 Backend API will be available at: http://localhost:5000');
console.log('\n💡 Press Ctrl+C to stop both servers');


