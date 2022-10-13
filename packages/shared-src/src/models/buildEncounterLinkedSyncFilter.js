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

function includeWithinEncounter(include, association) {
  let currentLevel = { association: null, include };
  while (currentLevel.association !== 'encounter') {
    const nextLevel = currentLevel.include[0];
    currentLevel = nextLevel;
  }
  currentLevel.include.push({ association, include: [] });
}

export function buildEncounterLinkedSyncFilter(
  patientIds,
  facilityConfig = {},
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
  if (facilityConfig.syncAllLabRequests) {
    or.push({ [`$${pathToEncounter}labRequest.id$`]: { [Op.not]: null } });
    if (isEncounter) {
      include.push('labRequest');
    } else {
      includeWithinEncounter(include, 'labRequest');
    }
  }

  // add any encounters with a vaccine in the list of scheduled vaccines that sync everywhere
  const vaccinesToSync =
    config.localisation?.data?.sync?.syncAllEncountersForTheseScheduledVaccines;
  if (vaccinesToSync?.length > 0) {
    or.push({
      [`$${pathToEncounter}administeredVaccine.scheduled_vaccine_id$`]: {
        [Op.in]: vaccinesToSync,
      },
    });
    if (isEncounter) {
      include.push('administeredVaccine');
    } else {
      includeWithinEncounter(include, 'administeredVaccine');
    }
  }

  return {
    where: {
      [Op.or]: or,
    },
    include,
  };
}
