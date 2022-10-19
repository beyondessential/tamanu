import { Op } from 'sequelize';
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

function includeWithinEncounter(include, includeClauseToAdd) {
  let currentLevel = { association: null, include };
  while (currentLevel.association !== 'encounter') {
    const nextLevel = currentLevel.include[0];
    currentLevel = nextLevel;
  }
  currentLevel.include.push(includeClauseToAdd);
}

export function buildEncounterLinkedSyncFilter(
  patientIds,
  sessionConfig = {},
  associationsToTraverse = ['encounter'], // e.g. ['surveyResponse', 'encounter'] to traverse up from SurveyResponseAnswer
  configOverride, // used in tests
) {
  if (patientIds.length === 0) {
    return null;
  }

  const config = { ...baseConfig, ...configOverride };
  const isEncounter = associationsToTraverse.length === 0;
  const pathToEncounter = isEncounter ? '' : `${associationsToTraverse.join('.')}.`;
  const include = buildNestedInclude(associationsToTraverse);

  // basic patient filter to only include data from encounters related to patients marked for sync
  const or = [{ [`$${pathToEncounter}patient_id$`]: { [Op.in]: patientIds } }];

  // add any encounters with a lab request, if syncing all labs is turned on for facility
  if (sessionConfig.syncAllLabRequests) {
    or.push({ [`$${pathToEncounter}labRequest.id$`]: { [Op.not]: null } });
    if (isEncounter) {
      include.push('labRequest');
    } else {
      includeWithinEncounter(include, { association: 'labRequest', include: [] });
    }
  }

  // add any encounters with a vaccine in the list of scheduled vaccines that sync everywhere
  const vaccinesToSync = config.localisation?.data?.sync?.syncAllEncountersForTheseVaccines;
  if (vaccinesToSync?.length > 0) {
    or.push({
      [`$${pathToEncounter}administeredVaccine.scheduledVaccine.vaccine_id$`]: {
        [Op.in]: vaccinesToSync,
      },
    });
    const includeScheduledVaccineClause = {
      association: 'administeredVaccine',
      include: ['scheduledVaccine'],
    };
    if (isEncounter) {
      include.push(includeScheduledVaccineClause);
    } else {
      includeWithinEncounter(include, includeScheduledVaccineClause);
    }
  }

  return {
    where: {
      [Op.or]: or,
    },
    include,
  };
}
