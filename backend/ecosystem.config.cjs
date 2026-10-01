module.exports = {
  apps: [
    {
      name: 'kratos-api',
      script: './server.js',
      // Un solo proceso: el limitador de intentos de login guarda su estado en memoria
      // y el servidor puede compartirse con otras aplicaciones.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
