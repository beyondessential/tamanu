const pushSync = require('./dbListeners/pushSync');
const mergeConflicts = require('./dbListeners/mergeConflicts');

module.exports = {
  dbListeners: () => {
    pushSync();
    mergeConflicts();
  },
  database: {
    createDB: require('./database/createDB'),
    getDB: require('./database/getDB'),
  },
};
