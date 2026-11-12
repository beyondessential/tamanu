import { Op } from 'sequelize';

// `availableFacilities` restricts a reference data row to a set of facilities. An unset list means
// no restriction — available everywhere — and both NULL and an empty array `[]` count as unset. The
// admin Manage form saves `[]` when the last facility is removed, so a row that treated `[]` as
// "available nowhere" would vanish from every facility instead.
//
// Two forms of the same rule: a Sequelize `where` fragment for queries, and a predicate for rows
// already loaded. Keep them in step.

export const buildAvailableFacilitiesFilter = facilityId => {
  if (!facilityId) return null;
  return {
    [Op.or]: [
      { availableFacilities: null },
      { availableFacilities: { [Op.eq]: [] } },
      { availableFacilities: { [Op.contains]: [facilityId] } },
    ],
  };
};

export const isAvailableAtFacility = (record, facilityId) => {
  if (!facilityId) return true;
  const { availableFacilities } = record;
  if (!availableFacilities?.length) return true;
  return availableFacilities.includes(facilityId);
};
