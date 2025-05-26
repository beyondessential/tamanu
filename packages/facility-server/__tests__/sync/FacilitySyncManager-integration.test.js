import { createTestContext } from '../utilities';

// Setup the pull with stuff mocked
// Only needs to call the pull
describe('FacilitySyncManager integration', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  it('should pull changes from central server', async () => {
    expect(models).toBeTruthy();
  });
});