import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'react-router-redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import rootReducer from '../reducers';

export function configureStore(initialState) {
  const history = createBrowserHistory();
  const router = routerMiddleware(history);
  const enhancer = applyMiddleware(thunk, router);

  // Create Store
  const persistConfig = {
    key: 'tamanu',
    storage,
    stateReconciler: autoMergeLevel2,
    whitelist: ['auth'],
    debug: true,
  };
  const persistedReducer = persistReducer(persistConfig, rootReducer);
  const store = createStore(persistedReducer, initialState, enhancer);

  const persistor = persistStore(store);
  return {
    store, persistor, persistConfig, history,
  };
}
