import { endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import { DELETION_STATUSES } from '@tamanu/constants';

import { getCurrentDateString } from './dateTime';
import { log } from '../services/logging';
import { sleepAsync } from './sleepAsync';

export const getDischargeOutPatientEncountersWhereClause = () => {
  const today = getCurrentDateString();

  return {
    encounterType: 'clinic',
    endDate: null,
    startDate: {
      [Op.lt]: today,
    },
    deletionStatus: DELETION_STATUSES.CURRENT,
  };
};

export const dischargeOutpatientEncounters = async (
  models,
  ids,
  batchSize = 1000,
  batchSleepAsyncDurationInMilliseconds = 50,
) => {
  const where = getDischargeOutPatientEncountersWhereClause();

  // If ids are passed in then we narrow down the encounters to only these ids
  if (ids && ids.length) {
    where.id = { [Op.in]: ids };
  }

  const oldEncountersCount = await models.Encounter.count({ where });
  const batchCount = Math.ceil(oldEncountersCount / batchSize);

  log.info(
    `Auto-closing ${oldEncountersCount} clinic encounters in ${batchCount} batch(es) (${batchSize} records per batch)`,
  );

  for (let i = 0; i < batchCount; i++) {
    const oldEncounters = await models.Encounter.findAll({
      where,
      limit: batchSize,
    });

    for (const oldEncounter of oldEncounters) {
      const justBeforeMidnight = endOfDay(parseISO(oldEncounter.startDate));
      await oldEncounter.update({
        endDate: justBeforeMidnight,
        systemNote: 'Automatically discharged',
        discharge: {
          note: 'Automatically discharged by outpatient discharger',
        },
      });
      log.info(`Auto-closed encounter with id ${oldEncounter.id}`);
    }

    await sleepAsync(batchSleepAsyncDurationInMilliseconds);
  }
};
