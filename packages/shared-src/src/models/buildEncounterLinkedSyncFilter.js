import { Op } from 'sequelize';
import config from 'config';

function buildNestedInclude(associations) {
  const include = [];
  associations.forEach((association, depth) => {
    let parentInclude = include;
    for (let i = 0; i <= depth; i++) {
      if (i === depth) {
        parentInclude.push({ association, include: [] });
      }
      [parentInclude] = parentInclude.include;
    }
  });
  return include;
}

function includeWithinEncounter(include, association) {
  let [parentInclude] = include;
  while (parentInclude.association !== 'encounter') {
    [parentInclude] = parentInclude.include;
  }
  parentInclude.include.push(association);
}

export function buildEncounterLinkedSyncFilter(
  patientIds,
  associationsToTraverse = ['encounter'], // e.g. ['surveyResponse', 'encounter'] to traverse up from SurveyResponseAnswer
) {
  const isEncounter = associationsToTraverse.length === 0;
  const pathToEncounter = isEncounter ? '' : `${associationsToTraverse.join('.')}.`;
  const include = buildNestedInclude(associationsToTraverse);

  // basic patient filter to only include data from encounters related to patients marked for sync
  const or = [{ [`$${pathToEncounter}patient_id$`]: { [Op.in]: patientIds } }];

  // add any encounters with a lab request, if syncing labs everywhere is turned on
  if (config.sync?.syncAllLabRequests) {
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
