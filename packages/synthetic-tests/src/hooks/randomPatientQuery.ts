/**
 * Query string fragments for GET /api/random/patient — patients with no active encounter.
 * Matches Sequelize default hasMany alias `Encounters` on Patient → Encounter.
 */
export const RANDOM_PATIENT_NO_OPEN_ENCOUNTER_QUERY = {
  where: JSON.stringify({
    '$Encounters.id$': null,
  }),
  include: JSON.stringify([
    {
      model: 'Encounter',
      required: false,
      where: { endDate: null },
      attributes: [],
    },
  ]),
} as const;
