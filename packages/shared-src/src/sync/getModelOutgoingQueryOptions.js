import { Op } from 'sequelize';

export const getModelOutgoingQueryOptions = (model, patientIds, since) => {
  const shouldFilterByPatient = !!model.buildSyncFilter && patientIds;
  if (shouldFilterByPatient && patientIds.length === 0) {
    return null;
  }

  const patientFilter = shouldFilterByPatient && model.buildSyncFilter(patientIds);
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
