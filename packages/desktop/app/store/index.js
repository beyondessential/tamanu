import { configureStore as configureStoreProd } from './configureStore.prod';

// TODO: update build system to exclude this from prod build entirely
import { configureStore as configureStoreDev } from './configureStore.dev';

const configurer = process.env.NODE_ENV === 'production' ? configureStoreProd : configureStoreDev;

export const { store, persistor, persistConfig, history } = configurer();
