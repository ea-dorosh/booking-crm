module.exports = {
  apps: [
    {
      name: 'booking-backend',
      script: 'dist/server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3500,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3500,
      },

      // Logging configuration
      log_file: 'logs/pm2-combined.log',
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      log_type: 'json',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Log rotation
      max_log_size: '50M',
      retain_log: 30,

      // Memory and CPU settings
      max_memory_restart: '1G',
      watch: false,
      autorestart: true,
      restart_delay: 1000,

      // Error handling
      max_restarts: 10,
      min_uptime: '10s',

      // Source map support
      source_map_support: true,

      // Health check
      health_check_grace_period: 3000,

      // Advanced settings for production
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // Custom monitoring
      monitoring: false,
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/booking-crm.git',
      path: '/var/www/booking-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
