import { SETTINGS_SCOPES } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { createTestContext } from '../utilities';

// The listener debounces a save into one run, with a maxWait of a second, and
// the NOTIFY has to make a round trip through Postgres first.
const SETTLE_MS = 1200;

const waitForRefresh = async refresh => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (refresh.mock.calls.length > 0) return;
    await sleepAsync(100);
  }
};

describe('AI settings listener', () => {
  let ctx;
  let models;
  let refresh;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });


  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    // let a run raised by the previous case land before it can count as this one's
    await sleepAsync(SETTLE_MS);
    refresh = jest.fn();
    ctx.refreshAiService = refresh;
  });

  it('rebuilds the service when an AI setting is written', async () => {
    await models.Setting.set('ai.anthropicModel', 'claude-opus-5', SETTINGS_SCOPES.CENTRAL);

    await waitForRefresh(refresh);

    expect(refresh).toHaveBeenCalled();
  });

  it('rebuilds the service when a prompt it reads is written', async () => {
    await models.Setting.set('patientSummary.prompts', 'summarise this', SETTINGS_SCOPES.GLOBAL);

    await waitForRefresh(refresh);

    expect(refresh).toHaveBeenCalled();
  });

  // An unresolvable row counts as a match, so this passing is also what proves the
  // notification's row id was resolved to its key rather than silently giving up.
  it('leaves the service alone for a setting it does not read', async () => {
    await models.Setting.set('export.maxFileSizeInMB', 55, SETTINGS_SCOPES.CENTRAL);

    await sleepAsync(SETTLE_MS);

    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('AI settings save', () => {
  let ctx;
  let adminApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    adminApp = await ctx.baseApp.asRole('admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  // The save rebuilds directly rather than waiting on its own notification, so this
  // has resolved by the time the response lands, ahead of the listener's debounce.
  it('rebuilds the service before the save responds', async () => {
    const refresh = jest.fn();
    ctx.refreshAiService = refresh;

    const result = await adminApp.put('/v1/admin/settings').send({
      scope: SETTINGS_SCOPES.CENTRAL,
      facilityId: null,
      settings: { ai: { anthropicModel: 'claude-opus-5' } },
    });

    expect(result).toHaveSucceeded();
    expect(refresh).toHaveBeenCalled();
  });
});
