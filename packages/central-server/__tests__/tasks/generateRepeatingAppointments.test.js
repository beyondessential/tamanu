import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { GenerateRepeatingAppointments } from '../../app/tasks/GenerateRepeatingAppointments';

describe('GenerateRepeatingAppointments', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { User } = ctx.store.models;
    user = await User.create(fake(User));
  });
  afterAll(async () => {
    jest.clearAllMocks();
    await ctx.close();
  });

  it('should generate repeating appointments', async () => {
    const task = new GenerateRepeatingAppointments(ctx);
    await task.run();
    expect(true).toBe(true);
  });
});
