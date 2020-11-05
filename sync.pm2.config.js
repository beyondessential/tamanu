module.exports = {
  apps: [{
    name: 'sync',
    script: 'yarn run sync-start-dev',
  }],
  deploy: {
    dev: {
      user: 'ubuntu',
      host: 'sync-dev.tamanu.io',
      ref: 'origin/dev',
      repo: 'git@github.com:beyondessential/tamanu',
      path: '/home/ubuntu/tamanu',
      'post-deploy' : 'yarn',
    }
  }
};
