import { expect, vi } from 'vitest';

import { extendExpect } from './extendExpect';

// Every facility suite runs against a stubbed central server: nothing here should reach the
// network, and the app builds its own CentralServerConnection in each route that needs one,
// so the module itself has to be replaced rather than a single instance. `doMock` rather than
// `mock` because there is nothing to hoist above — this file runs before the test file is
// imported, which is also why ./extendExpect exists separately from ./utilities (a module a
// setup file imports is cached beyond the reach of these mocks).
vi.doMock('../app/sync/CentralServerConnection');
vi.doMock('../app/utils/uploadAttachment');

extendExpect(expect);

