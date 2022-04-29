module.exports = {
  apps: [{
    name: "tamanu-lan-server",
    instances: 1,
    script: "./dist/app.bundle.js",
    time: true,
    log_date_format : "YYYY-MM-DD HH:mm Z",
    env: {
      NODE_ENV: "production"
    }
  }]
}
