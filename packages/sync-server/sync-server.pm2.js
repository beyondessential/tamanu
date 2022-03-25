module.exports = {
  apps: [{
    name: "tamanu-sync-server",
    script: "./dist/app.bundle.js",
    interpreter_args: "--max_old_space_size=8192",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    }
  }]
}