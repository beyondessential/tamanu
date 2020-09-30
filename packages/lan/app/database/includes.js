/**
 * These objects are for use in sequelize include parameter queries
 *  e.g. simpleGetList('LabRequest', '', { include: [ENCOUNTER_PATIENT] })
 */

// TODO: Only include name fields
export const ENCOUNTER_PATIENT = { association: 'encounter', include: ['patient'] };
