import { extendExpect } from './utilities';

import crypto from 'crypto';
globalThis.crypto = crypto;

jest.setTimeout(100000);

// eslint-disable-next-line no-undef
extendExpect(expect);
