module.exports = {
  apps: [
    {
      name: 'netcontact-api',
      script: './server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
