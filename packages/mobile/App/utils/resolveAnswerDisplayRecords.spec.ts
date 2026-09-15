import { resolveAnswerDisplayRecords } from './resolveAnswerDisplayRecords';
import { FieldTypes } from '~/ui/helpers/fields';

/**
 * Builds a stub models map whose repositories return the given rows. Each repository records the
 * find options it was called with, so tests can assert how many queries a resolve issued.
 */
const buildStubModels = (rowsByModelName: Record<string, any[]>, relations: any[] = []) => {
  const findCalls: Record<string, any[]> = {};

  const models: Record<string, any> = {};
  for (const [modelName, rows] of Object.entries(rowsByModelName)) {
    findCalls[modelName] = [];
    models[modelName] = {
      getRepository: () => ({
        metadata: { relations },
        find: async (options: any) => {
          findCalls[modelName].push(options);
          const { id, code } = options.where;
          if (id) return rows.filter(row => id._value.includes(row.id));
          if (code) return rows.filter(row => code._value.includes(row.code));
          return rows;
        },
      }),
    };
  }

  return { models, findCalls };
};

const autocompleteAnswer = (source: string, answer: string) => ({
  type: FieldTypes.AUTOCOMPLETE,
  config: JSON.stringify({ source }),
  answer,
});

describe('resolveAnswerDisplayRecords', () => {
  it('issues one query for several autocomplete answers on the same model', async () => {
    const { models, findCalls } = buildStubModels({
      ReferenceData: [
        { id: 'village-a', name: 'Village A' },
        { id: 'village-b', name: 'Village B' },
      ],
    });

    const { recordsByModelNameAndId } = await resolveAnswerDisplayRecords(models, [
      autocompleteAnswer('ReferenceData', 'village-a'),
      autocompleteAnswer('ReferenceData', 'village-b'),
    ]);

    expect(findCalls.ReferenceData).toHaveLength(1);
    expect(recordsByModelNameAndId.ReferenceData['village-a'].name).toBe('Village A');
    expect(recordsByModelNameAndId.ReferenceData['village-b'].name).toBe('Village B');
  });

  it('issues one query per distinct source model', async () => {
    const { models, findCalls } = buildStubModels({
      ReferenceData: [{ id: 'village-a', name: 'Village A' }],
      User: [{ id: 'user-a', displayName: 'Alice' }],
    });

    await resolveAnswerDisplayRecords(models, [
      autocompleteAnswer('ReferenceData', 'village-a'),
      autocompleteAnswer('User', 'user-a'),
    ]);

    expect(findCalls.ReferenceData).toHaveLength(1);
    expect(findCalls.User).toHaveLength(1);
  });

  it('collapses duplicate ids into a single bound parameter', async () => {
    const { models, findCalls } = buildStubModels({
      ReferenceData: [{ id: 'village-a', name: 'Village A' }],
    });

    await resolveAnswerDisplayRecords(models, [
      autocompleteAnswer('ReferenceData', 'village-a'),
      autocompleteAnswer('ReferenceData', 'village-a'),
    ]);

    expect(findCalls.ReferenceData).toHaveLength(1);
    expect(findCalls.ReferenceData[0].where.id._value).toEqual(['village-a']);
  });

  it('leaves an unresolvable id out of the map so the renderer falls back to raw text', async () => {
    const { models } = buildStubModels({ ReferenceData: [] });

    const { recordsByModelNameAndId } = await resolveAnswerDisplayRecords(models, [
      autocompleteAnswer('ReferenceData', 'deleted-village'),
    ]);

    expect(recordsByModelNameAndId.ReferenceData['deleted-village']).toBeUndefined();
  });

  it('resolves a record that is no longer current', async () => {
    const { models } = buildStubModels({
      ReferenceData: [{ id: 'old-village', name: 'Old Village', visibilityStatus: 'historical' }],
    });

    const { recordsByModelNameAndId } = await resolveAnswerDisplayRecords(models, [
      autocompleteAnswer('ReferenceData', 'old-village'),
    ]);

    expect(recordsByModelNameAndId.ReferenceData['old-village'].name).toBe('Old Village');
  });

  it('resolves a survey answer question and the record its source question references', async () => {
    const { models, findCalls } = buildStubModels({
      ProgramDataElement: [
        {
          code: 'source-question',
          surveyScreenComponent: {
            config: JSON.stringify({ source: 'ReferenceData' }),
            dataElement: { type: FieldTypes.AUTOCOMPLETE },
          },
        },
      ],
      ReferenceData: [{ id: 'village-a', name: 'Village A' }],
    });

    const { sourceQuestionsByDataElementCode, recordsByModelNameAndId } =
      await resolveAnswerDisplayRecords(models, [
        {
          type: FieldTypes.SURVEY_ANSWER,
          config: JSON.stringify({ source: 'source-question' }),
          answer: 'village-a',
        },
      ]);

    expect(findCalls.ProgramDataElement).toHaveLength(1);
    expect(sourceQuestionsByDataElementCode['source-question']).toBeDefined();
    expect(recordsByModelNameAndId.ReferenceData['village-a'].name).toBe('Village A');
  });

  it('resolves linked survey responses with their survey', async () => {
    const { models, findCalls } = buildStubModels({
      SurveyResponse: [{ id: 'response-a', survey: { name: 'Linked survey' } }],
    });

    const { linkedSurveyResponsesById } = await resolveAnswerDisplayRecords(models, [
      { type: FieldTypes.SURVEY_LINK, config: null, answer: 'response-a' },
    ]);

    expect(findCalls.SurveyResponse[0].relations).toEqual(['survey']);
    expect(linkedSurveyResponsesById['response-a'].survey.name).toBe('Linked survey');
  });

  it('issues no queries for an empty answer list', async () => {
    const { models, findCalls } = buildStubModels({ ReferenceData: [] });

    const displayRecords = await resolveAnswerDisplayRecords(models, []);

    expect(findCalls.ReferenceData).toHaveLength(0);
    expect(displayRecords.recordsByModelNameAndId).toEqual({});
  });

  it('chunks large id lists to stay under the bound parameter limit', async () => {
    const villages = Array.from({ length: 1200 }, (_, index) => ({
      id: `village-${index}`,
      name: `Village ${index}`,
    }));
    const { models, findCalls } = buildStubModels({ ReferenceData: villages });

    const { recordsByModelNameAndId } = await resolveAnswerDisplayRecords(
      models,
      villages.map(({ id }) => autocompleteAnswer('ReferenceData', id)),
    );

    expect(findCalls.ReferenceData).toHaveLength(3);
    expect(Object.keys(recordsByModelNameAndId.ReferenceData)).toHaveLength(1200);
  });

  it('skips an unknown source model rather than throwing', async () => {
    const { models } = buildStubModels({ ReferenceData: [] });

    const { recordsByModelNameAndId } = await resolveAnswerDisplayRecords(models, [
      autocompleteAnswer('NotAModel', 'some-id'),
    ]);

    expect(recordsByModelNameAndId.NotAModel).toBeUndefined();
  });

  it('skips a malformed config rather than throwing', async () => {
    const { models } = buildStubModels({ ReferenceData: [] });

    const displayRecords = await resolveAnswerDisplayRecords(models, [
      { type: FieldTypes.AUTOCOMPLETE, config: '{not json', answer: 'some-id' },
    ]);

    expect(displayRecords.recordsByModelNameAndId).toEqual({});
  });
});
