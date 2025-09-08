import { Buffer as BufferPolyfill } from 'buffer';

if (!globalThis.Buffer) {
  globalThis.Buffer = BufferPolyfill;
}
