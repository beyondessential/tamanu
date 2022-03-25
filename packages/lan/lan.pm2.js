module.exports = {
  apps: [{
    name: "tamanu-lan-server",
    instances: 1,
    script: "./dist/app.bundle.js",
    env: {
      NODE_ENV: "production"
    }
  }]
}