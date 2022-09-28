import { Op } from 'sequelize';

// The hardest thing about sync is knowing what happens at the clock tick border - do we want
// records strictly >, or >= the cursor being requested? We use strict > for the following reasons:
// - Push to central server: because we save the local tick as it was before the push started as the
//   successful push tick, and increment the local clock just before taking the local snapshot to
//   push, we know that any changes since starting the push will be recorded using a higher tick.
//   There is the possibility of changes that are made between the time we increment the local clock
//   and the time we finish the snapshot being pushed twice, but that's ok because pushing a change
//   is idempotent (actually not quite under the current conflict resolution model, but good enough)
// - Pull from central server: using > here just means we definitely don't get any of the same
//   changes twice, though see above for why it wouldn't actually be a big deal if we did
export const getModelOutgoingQueryOptions = (model, patientIds, since, facilitySettings) => {
  const shouldFilterByPatient = !!model.buildSyncFilter && patientIds;
  if (shouldFilterByPatient && patientIds.length === 0) {
    return null;
  }

  const patientFilter =
    shouldFilterByPatient && model.buildSyncFilter(patientIds, facilitySettings);
  const baseFilter = {
    where: { updatedAtSyncTick: { [Op.gt]: since } },
  };

  return patientFilter
    ? {
        ...patientFilter,
        where: { ...baseFilter.where, ...patientFilter.where },
      }
    : baseFilter;
};
