import { Op } from 'sequelize';

export const getModelOutgoingQueryOptions = (model, patientIds, fromSessionIndex) => {
  const shouldFilterByPatient = !!model.buildSyncFilter && patientIds;
  if (shouldFilterByPatient && patientIds.length === 0) {
    return null;
  }

  const patientFilter = shouldFilterByPatient && model.buildSyncFilter(patientIds);
  const baseFilter = {
    where: { updatedAtSyncIndex: { [Op.gte]: fromSessionIndex } },
  };

  return patientFilter
    ? {
        ...patientFilter,
        where: { ...baseFilter.where, ...patientFilter.where },
      }
    : baseFilter;
};
