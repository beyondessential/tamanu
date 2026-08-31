import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library only registers its own cleanup when a global `afterEach` exists, which
// is to say when `globals: true` is set. This suite imports its test functions explicitly (so a
// missing import is a lint error rather than a runtime one), so unmount between cases here
// instead. Without it, each test renders into the DOM the last one left behind and any
// `getBy*` query that matches more than one element throws.
afterEach(cleanup);
