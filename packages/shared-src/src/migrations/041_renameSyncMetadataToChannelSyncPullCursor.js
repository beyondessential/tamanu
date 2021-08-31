module.exports = {
  up: async query => {
    await query.renameTable('sync_metadata', 'channel_sync_pull_cursors');
  },
  down: async query => {
    await query.renameTable('channel_sync_pull_cursors', 'sync_metadata');
  },
};
