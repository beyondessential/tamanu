import { endOfDay, startOfDay, sub, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';

export const dischargeOutpatientEncounters = async (
  models,
  ids,
  batchSize = 1000,
  batchSleepAsyncDurationInMilliseconds = 50,
) => {
  const startOfToday = startOfDay(new Date());

  const where = {
    encounterType: 'clinic',
    endDate: null,
    startDate: {
      [Op.lt]: startOfToday,
    },
  };

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
      const justBeforeMidnight = sub(endOfDay(parseISO(oldEncounter.startDate)), { minutes: 1 });
      await oldEncounter.update({
        endDate: justBeforeMidnight,
        systemNote: 'Automatically discharged',
      });
      log.info(`Auto-closed encounter with id ${oldEncounter.id}`);
    }

    await sleepAsync(batchSleepAsyncDurationInMilliseconds);
  }
};
