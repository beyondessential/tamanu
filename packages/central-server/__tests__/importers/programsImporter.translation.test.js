import { Op } from 'sequelize';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';
import { getReferenceDataOptionStringId } from '@tamanu/shared/utils/translation';

import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { programImporter } from '../../dist/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';
import { normaliseOptions } from '../../app/admin/importer/translationHandler';

// the importer can take a little while
jest.setTimeout(60000);

describe('Programs import - Translation', () => {
  let ctx;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  beforeEach(async () => {
    const { Program, Survey, ProgramDataElement, SurveyScreenComponent, TranslatedString } =
      ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
    await TranslatedString.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, xml = false, ...opts } = options;
    return importerTransaction({
      importer: programImporter,
      file: `./__tests__/importers/programs-${file}${xml ? '.xml' : '.xlsx'}`,
      models: ctx.store.models,
      checkPermission: () => true,
      ...opts,
    });
  }

  it('should create translations for the vitals survey', async () => {
    await doImport({
      file: 'vitals-valid',
      dryRun: false,
    });

    const translations = await models.TranslatedString.findAll();
    const generatedStringIds = translations.map(translation => translation.stringId);

    const programStringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.program.program-testvitals`;
    const surveyStringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.survey.program-testvitals-vitalsgood`;

    //check if the program and survey string ids are in the generated string ids
    expect(generatedStringIds).toContain(programStringId);
    expect(generatedStringIds).toContain(surveyStringId);

    // Check each data element has an appropriate string id
    const dataElements = await models.ProgramDataElement.findAll();
    dataElements.forEach(dataElement => {
      const stringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.programDataElement.${dataElement.id}`;
      expect(generatedStringIds).toContain(stringId);
    });
  });

  it('should translate nested options', async () => {
    await doImport({
      file: 'vitals-valid',
      dryRun: false,
    });

    // find all elements with options
    const programDataElements = await models.ProgramDataElement.findAll({
      where: {
        defaultOptions: {
          [Op.ne]: null,
        },
      },
    });

    if (programDataElements.length === 0)
      throw new Error('No program data elements with options found in vitals-valid.xlsx');

    const translations = await models.TranslatedString.findAll({
      where: { stringId: { [Op.like]: 'refData.programDataElement%' } },
    });
    const stringIds = translations.map(translation => translation.stringId);

    const expectedStringIds = programDataElements
      .map(pde =>
        normaliseOptions(pde.defaultOptions).map(option =>
          getReferenceDataOptionStringId(pde.id, 'programDataElement', option),
        ),
      )
      .flat();

    expect(stringIds).toEqual(expect.arrayContaining(expectedStringIds));
  });

  it('should translate text and detail fields for survey screen components', async () => {
    await doImport({
      file: 'valid',
      dryRun: false,
    });

    const surveyScreenComponents = await models.SurveyScreenComponent.findAll();
    let expectedStringIds = [];
    surveyScreenComponents.forEach(surveyScreenComponent => {
      if (surveyScreenComponent.text) {
        expectedStringIds.push(
          `${REFERENCE_DATA_TRANSLATION_PREFIX}.surveyScreenComponent.text.${surveyScreenComponent.id}`,
        );
      }
      if (surveyScreenComponent.detail) {
        expectedStringIds.push(
          `${REFERENCE_DATA_TRANSLATION_PREFIX}.surveyScreenComponent.detail.${surveyScreenComponent.id}`,
        );
      }
    });

    const translatedStrings = await models.TranslatedString.findAll({
      where: { stringId: { [Op.like]: 'refData.surveyScreenComponent%' } },
    });

    const generatedStringIds = translatedStrings.map(translation => translation.stringId);

    expect(generatedStringIds).toEqual(expect.arrayContaining(expectedStringIds));
  });

  it('should handle spaces, dots, and semicolons in option strings', async () => {
    await doImport({
      file: 'invalid-translation-string-ids',
      dryRun: false,
    });

    // find all elements with options
    const programDataElements = await models.ProgramDataElement.findAll({
      where: {
        defaultOptions: {
          [Op.ne]: null,
        },
      },
    });

    if (programDataElements.length === 0)
      throw new Error('No program data elements with options found in invalid-translation-string-ids.xlsx');

    const translations = await models.TranslatedString.findAll({
      where: { stringId: { [Op.like]: 'refData.programDataElement%' } },
    });
    const stringIds = translations.map(translation => translation.stringId);

    const expectedStringIds = programDataElements
      .map(pde =>
        normaliseOptions(pde.defaultOptions).map(option =>
          getReferenceDataOptionStringId(pde.id, 'programDataElement', option),
        ),
      )
      .flat();

    expect(stringIds).toEqual(expect.arrayContaining(expectedStringIds));
  });
});
