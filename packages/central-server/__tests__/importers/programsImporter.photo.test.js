import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { programImporter } from '../../app/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
vi.setConfig({ testTimeout: 60000 });

// A Photo question can be configured to write its captured image onto the patient record. This
// goes through the importer rather than the schema directly, because the schema is only reached
// if `importRows` resolves it by name (SSCPhoto) and the sanitiser lets `writeToPatient`
// survive — both of which can regress independently of the schema itself.
describe('Programs import - Photo questions', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    const { Program, Survey, ProgramDataElement, SurveyScreenComponent } = ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await ctx.close();
  });

  const doImport = file =>
    importerTransaction({
      importer: programImporter,
      file: `./__tests__/importers/programs-${file}.xml`,
      models: ctx.store.models,
      checkPermission: () => true,
      dryRun: false,
    });

  it('imports a photo question that writes the patient profile photo', async () => {
    const { errors, stats } = await doImport('photo-write-profile');

    expect(errors).toHaveLength(0);
    expect(stats).toMatchObject({
      SurveyScreenComponent: { created: 1, updated: 0, errored: 0 },
    });

    const component = await ctx.store.models.SurveyScreenComponent.findOne();
    expect(JSON.parse(component.config)).toEqual({
      writeToPatient: { fieldName: 'profilePhoto' },
    });
  });

  it('refuses a photo question that writes any other patient field', async () => {
    const { errors } = await doImport('photo-write-invalid-field');

    expect(errors).not.toHaveLength(0);
    expect(errors[0].message).toMatch(/writeToPatient\.fieldName/);
  });
});
