import { expect, beforeAll, describe, it } from '@jest/globals';
import * as fc from 'fast-check';

import { createTestContext } from '../utilities';
import { snapshotOutgoingChanges } from '../../app/sync/snapshotOutgoingChanges';

const readOnlyConfig = readOnly => ({ sync: { readOnly } });

describe('snapshotOutgoingChanges', () => {
  let ctx, models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    // await ctx.baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  it.todo('');
});
