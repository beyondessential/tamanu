import Sequelize, { Op } from 'sequelize';
import baseConfig from 'config';

function buildNestedInclude(associations) {
  const topLevel = { include: [] };
  let currentLevel = topLevel;
  associations.forEach(association => {
    const nextLevel = { association, include: [] };
    currentLevel.include.push(nextLevel);
    currentLevel = nextLevel;
  });
  return topLevel.include;
}

export function buildEncounterLinkedSyncFilter(
  model,
  patientIds,
  sessionConfig = {},
  associationsToTraverse = ['encounter'], // e.g. ['surveyResponse', 'encounter'] to traverse up from SurveyResponseAnswer
  configOverride, // used in tests
) {
  if (patientIds.length === 0) {
    return null;
  }

  const config = { ...baseConfig, ...configOverride };
  const isEncounter = model.name === 'Encounter';
  const pathToEncounter = isEncounter ? '' : `${associationsToTraverse.join('.')}.`;
  const include = buildNestedInclude(associationsToTraverse);

  // basic patient filter to only include data from encounters related to patients marked for sync
  const or = [{ [`$${pathToEncounter}patient_id$`]: { [Op.in]: patientIds } }];

  // add any encounters with a lab request, if syncing all labs is turned on for facility
  if (sessionConfig.syncAllLabRequests && isEncounter) {
    or.push({
      id: {
        [Op.in]: Sequelize.literal(
          `(
            SELECT DISTINCT(encounter_id)
            FROM lab_requests
            WHERE deleted_at IS NULL
           )`,
        ),
      },
    });
  }

  // add any encounters with a vaccine in the list of scheduled vaccines that sync everywhere
  const vaccinesToSync = config.sync.syncAllEncountersForTheseVaccines;
  if (vaccinesToSync?.length > 0) {
    const escapedVaccineIds = vaccinesToSync.map(id => model.sequelize.escape(id)).join(',');
    if (isEncounter) {
      or.push({
        id: {
          [Op.in]: Sequelize.literal(
            `(
            SELECT DISTINCT(encounter_id)
            FROM administered_vaccines
            JOIN scheduled_vaccines
            ON administered_vaccines.id = scheduled_vaccines.id
            WHERE administered_vaccines.deleted_at IS NULL
            AND scheduled_vaccines.deleted_at IS NULL
            AND scheduled_vaccines.vaccine_id IN (${escapedVaccineIds})
           )`,
          ),
        },
      });
    }
    if (model.name === 'AdministeredVaccine') {
      or.push({
        scheduled_vaccine_id: {
          [Op.in]: Sequelize.literal(
            `(
            SELECT DISTINCT(scheduled_vaccines.id)
            FROM scheduled_vaccines
            WHERE scheduled_vaccines.deleted_at IS NULL
            AND scheduled_vaccines.vaccine_id IN (${escapedVaccineIds})
           )`,
          ),
        },
      });
    }
  }

  return {
    where: {
      [Op.or]: or,
    },
    include,
  };
}
