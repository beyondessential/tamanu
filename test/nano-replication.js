const Promise = require('bluebird');
const nano = require('nano')('http://couchadmin:test@localhost:5984');

// const mainDB = nano.use('main');
Promise.promisifyAll(nano.db);

(async () => {
  try {
    await nano.db.replicateAsync('main', 'http://localhost:3000/couchProxy/main123', { create_target: false });
    console.log('Replicated!');
    process.exit();
  } catch (err) {
    console.error('Error: ', err);
  }
})();
