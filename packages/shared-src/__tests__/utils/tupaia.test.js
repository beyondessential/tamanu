import { translateReportDataToSurveyResponses } from '../../src/utils';

describe('tupaia', () => {
  it('translateReportDataToSurveyResponses()', () => {
    const reportData = [
      ['entity_code', 'timestamp', 'dataElementX', 'start_time', 'end_time'],
      ['entityA', '2021-01-01T00:00:00', 5, '2020-01-01T00:00:00Z', '2020-01-02T00:00:00Z'],
      ['entityB', '2021-01-02T00:00:00', 6, '2020-01-01T00:00:00Z', '2020-01-02T00:00:00Z'],
      ['entityC', '2021-01-03T00:00:00', null, '2020-01-01T00:00:00Z', '2020-01-02T00:00:00Z'],
    ];

    const result = translateReportDataToSurveyResponses('survey_abc123', reportData);

    expect(result).toEqual([
      {
        survey_id: 'survey_abc123',
        entity_code: 'entityA',
        timestamp: '2021-01-01T00:00:00',
        start_time: '2020-01-01T00:00:00Z',
        end_time: '2020-01-02T00:00:00Z',
        answers: {
          dataElementX: 5,
        },
      },
      {
        survey_id: 'survey_abc123',
        entity_code: 'entityB',
        timestamp: '2021-01-02T00:00:00',
        start_time: '2020-01-01T00:00:00Z',
        end_time: '2020-01-02T00:00:00Z',
        answers: {
          dataElementX: 6,
        },
      },
      {
        survey_id: 'survey_abc123',
        entity_code: 'entityC',
        timestamp: '2021-01-03T00:00:00',
        start_time: '2020-01-01T00:00:00Z',
        end_time: '2020-01-02T00:00:00Z',
        answers: {},
      },
    ]);
  });
});
