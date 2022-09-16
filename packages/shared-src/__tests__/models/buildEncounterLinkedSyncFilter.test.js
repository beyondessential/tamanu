import { Op } from 'sequelize';
import { buildEncounterLinkedSyncFilter } from '../../src/models/buildEncounterLinkedSyncFilter';

const PATIENT_IDS = ['xxx', 'yyy', 'zzz'];
const IN_PATIENT_IDS = {
  [Op.in]: PATIENT_IDS,
};

describe('buildEncounterLinkedSyncFilter', () => {
  it('goes via encounter by default', () => {
    const filter = buildEncounterLinkedSyncFilter(PATIENT_IDS);
    expect(filter).toEqual({
      where: {
        [Op.or]: [{ '$encounter.patient_id$': IN_PATIENT_IDS }],
      },
      include: [{ association: 'encounter', include: [] }],
    });
  });

  it('assumes it is the encounter if an empty array is passed', () => {
    const filter = buildEncounterLinkedSyncFilter(PATIENT_IDS, {}, []);
    expect(filter).toEqual({
      where: {
        [Op.or]: [{ $patient_id$: IN_PATIENT_IDS }],
      },
      include: [],
    });
  });

  it('traverses the associations in the array to build a filter', () => {
    const filter = buildEncounterLinkedSyncFilter(PATIENT_IDS, {}, [
      'potato',
      'lunch',
      'encounter',
    ]);
    expect(filter).toEqual({
      where: {
        [Op.or]: [{ '$potato.lunch.encounter.patient_id$': IN_PATIENT_IDS }],
      },
      include: [
        {
          association: 'potato',
          include: [{ association: 'lunch', include: [{ association: 'encounter', include: [] }] }],
        },
      ],
    });
  });

  it('adds encounters with scheduled vaccines specified in config', () => {
    const importantVaccines = ['covax', 'cominarty'];
    const config = {
      localisation: {
        data: {
          sync: { syncAllEncountersForTheseScheduledVaccines: importantVaccines },
        },
      },
    };
    const filter = buildEncounterLinkedSyncFilter(
      PATIENT_IDS,
      {},
      ['surveyResponse', 'encounter'],
      config,
    );
    expect(filter).toEqual({
      where: {
        [Op.or]: [
          { '$surveyResponse.encounter.patient_id$': IN_PATIENT_IDS },
          {
            '$surveyResponse.encounter.administeredVaccine.scheduled_vaccine_id$': {
              [Op.in]: importantVaccines,
            },
          },
        ],
      },
      include: [
        {
          association: 'surveyResponse',
          include: [
            {
              association: 'encounter',
              include: [{ association: 'administeredVaccine', include: [] }],
            },
          ],
        },
      ],
    });
  });

  it('adds in lab requests if that flag is turned on', () => {
    const filter = buildEncounterLinkedSyncFilter(
      PATIENT_IDS,
      {
        syncAllLabRequests: true,
      },
      ['surveyResponse', 'encounter'],
    );
    expect(filter).toEqual({
      where: {
        [Op.or]: [
          { '$surveyResponse.encounter.patient_id$': IN_PATIENT_IDS },
          {
            '$surveyResponse.encounter.labRequest.id$': { [Op.not]: null },
          },
        ],
      },
      include: [
        {
          association: 'surveyResponse',
          include: [
            {
              association: 'encounter',
              include: [{ association: 'labRequest', include: [] }],
            },
          ],
        },
      ],
    });
  });

  it('adds in both scheduled vaccines and lab requests if both are turned on', () => {
    const importantVaccines = ['covax', 'cominarty'];
    const config = {
      localisation: {
        data: {
          sync: {
            syncAllEncountersForTheseScheduledVaccines: importantVaccines,
          },
        },
      },
    };

    const filter = buildEncounterLinkedSyncFilter(
      PATIENT_IDS,
      {
        syncAllLabRequests: true,
      },
      ['surveyResponse', 'encounter'],
      config,
    );
    expect(filter).toEqual({
      where: {
        [Op.or]: [
          { '$surveyResponse.encounter.patient_id$': IN_PATIENT_IDS },
          {
            '$surveyResponse.encounter.labRequest.id$': { [Op.not]: null },
          },
          {
            '$surveyResponse.encounter.administeredVaccine.scheduled_vaccine_id$': {
              [Op.in]: importantVaccines,
            },
          },
        ],
      },
      include: [
        {
          association: 'surveyResponse',
          include: [
            {
              association: 'encounter',
              include: [
                { association: 'labRequest', include: [] },
                { association: 'administeredVaccine', include: [] },
              ],
            },
          ],
        },
      ],
    });
  });
});
