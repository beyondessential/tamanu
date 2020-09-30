/** These objects are for use in sequelize include parameter queries */

export const ENCOUNTER_PATIENT = { association: 'encounter', include: ['patient'] };
