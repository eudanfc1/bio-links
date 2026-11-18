module.exports = {
  apps: [{
    name: 'bio-links',
    script: 'npm',
    args: 'start',
    cwd: '/home/USUARIO/bio-links',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true
  }]
};
