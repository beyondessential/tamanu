const memory = process.env.TAMANU_MEMORY_ALLOCATION || 8192;

module.exports = {
  apps: [{
    name: "tamanu-sync-server",
    script: "./dist/app.bundle.js",
    interpreter_args: `--max_old_space_size=${memory}`,
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    }
  }]
}
