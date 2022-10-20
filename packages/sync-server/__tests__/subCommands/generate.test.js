import { generateFiji } from '../../app/subCommands/generate/fiji';
import { createTestContext } from '../utilities';

describe('`generate fiji` subcommand', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('inserts patients', async () => {
    // set high so it won't ever be flaky, test should take under 10 seconds on a dev laptop
    jest.setTimeout(30000);
    const patientsToGenerate = 20;
    const { Patient } = ctx.store.models;
    const numPatients = await Patient.count();

    await generateFiji({ patientCount: patientsToGenerate.toString() });

    expect(await Patient.count()).toEqual(numPatients + patientsToGenerate);
  });
});
