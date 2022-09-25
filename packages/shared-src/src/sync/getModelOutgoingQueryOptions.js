import { Op } from 'sequelize';

// The hardest thing about sync is knowing what happens at the clock tick border - do we want
// records strictly >, or >= the cursor being requested? We use >= for the following reasons:
// - Push to central server: if the last successful sync happened at tick 120, any changes since
//   that tick will be recorded as updated at tick 120, so we need to include them using >=
// - Pull from central server: if any changes happen on the central server directly, before another
//   facility triggers a new tick of the sync clock, they will be recorded as updated at tick 120
//   also, so when pulling we need to include them using >=
//   (The downside of this is that we know that 99% of the time it will have all records updated at
//   120 locally already, so we waste a bit of time adding them. However, for other reasons we need
//   to filter out any "echoed" records before sending them down to the facility server anyway, so
//   this just adds some extra records that get filtered during that process and keeps things simple
//   and robust)
export const getModelOutgoingQueryOptions = (model, patientIds, since, facilitySettings) => {
  const shouldFilterByPatient = !!model.buildSyncFilter && patientIds;
  if (shouldFilterByPatient && patientIds.length === 0) {
    return null;
  }

  const patientFilter =
    shouldFilterByPatient && model.buildSyncFilter(patientIds, facilitySettings);
  const baseFilter = {
    where: { updatedAtSyncTick: { [Op.gte]: since } },
  };

  return patientFilter
    ? {
        ...patientFilter,
        where: { ...baseFilter.where, ...patientFilter.where },
      }
    : baseFilter;
};
