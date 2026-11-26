import { createRoot } from 'react-dom/client';

import { renderRootInto } from './Root';
import { API } from './api/singletons';
import { initWebTelemetry } from './telemetry';
import { registerYup } from './utils/errorMessages';
import { systemErrorStore } from './state/systemErrorStore';

import '@fortawesome/fontawesome-free/css/all.css';
import './fonts.css';

function start() {
  registerYup();

  // spec: BTEL — start browser performance telemetry (collects from before sign-in).
  initWebTelemetry(API);

  API.setSystemErrorHandler(error => {
    systemErrorStore.add(error);
  });

  // TODO: Switch to use api when we get rid of API singleton
  // const api = new TamanuApi(version);
  const container = document.getElementById('root');

  const root = createRoot(container); // createRoot(container!) if you use TypeScript
  renderRootInto(root, {
    api: API,
  });
}

start();
