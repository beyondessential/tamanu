import { COLUMNS_TO_DATA_ELEMENT_ID, migrateVitals } from '../../dist/subCommands/migrateVitals';
import { initDatabase } from '../../dist/database';

jest.mock('../../dist/database', () => ({
  initDatabase: vi.fn().mockResolvedValue({
    models: {
      Vitals: {
        count: vi.fn().mockResolvedValue(1),
        findAll: vi.fn().mockResolvedValue([
          {
            dataValues: {
              id: 'test-vital',
              encounterId: 'encounterId',
              updatedAt: 'updatedAt',
              createdAt: 'createdAt',
              dateRecorded: 'dateRecorded',

              height: 180,
              weight: 95,
            },
          },
        ]),
      },
      Survey: {
        findOne: vi.fn().mockResolvedValue({ dataValues: { id: 'vitals-survey' } }),
      },
      SurveyResponse: {
        bulkCreate: vi.fn(),
      },
      SurveyResponseAnswer: {
        bulkCreate: vi.fn(),
      },
    },
    sequelize: {
      query: vi.fn(),
      transaction: vi.fn().mockImplementation(async (options, callback) => {
        await callback();
      }),
    },
  }),
}));

describe('`migrateVitals` subcommand', () => {
  let mockStore;
  beforeAll(async () => {
    mockStore = await initDatabase();
  });

  it('Generates survey response from vitals record', async () => {
    await migrateVitals();

    expect(mockStore.models.SurveyResponse.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        encounterId: 'encounterId',
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        startTime: 'dateRecorded',
        endTime: 'dateRecorded',
        surveyId: 'vitals-survey',
      }),
    ]);
    expect(mockStore.models.SurveyResponseAnswer.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          dataElementId: COLUMNS_TO_DATA_ELEMENT_ID.height,
          body: 180,
        }),
        expect.objectContaining({
          dataElementId: COLUMNS_TO_DATA_ELEMENT_ID.weight,
          body: 95,
        }),
      ]),
    );
  });
});
