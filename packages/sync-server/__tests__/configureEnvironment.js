import { extendExpect } from './utilities';

// TextDecoder is undefined in jest environment
// Required for cbor
const { TextDecoder } = require('util');

global.TextDecoder = TextDecoder;

// eslint-disable-next-line no-undef
extendExpect(expect);
