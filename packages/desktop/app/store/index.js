// @flow
let filename;
if (process.env.NODE_ENV === 'production') {
  filename = 'configureStore.prod';
} else {
  filename = 'configureStore.dev';
}

const { configureStore, history } = require(`./${filename}`); // eslint-disable-line global-require
const { store, persistor, persistConfig } = configureStore();
module.exports = { store, persistor, persistConfig, history };
