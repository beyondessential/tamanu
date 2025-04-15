import { Chance } from 'chance';
import { ENCOUNTER_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';

const chance = new Chance();

const randomObjectValue = (obj) => {
  const values = Object.values(obj);
  return chance.pickone(values);
};
const randomEncounterType = () => randomObjectValue(ENCOUNTER_TYPES);
const randomVisibilityStatus = () => randomObjectValue(VISIBILITY_STATUSES);

const randomIsoDobString = () => chance.birthday().toISOString().slice(0, 10);

export const randomNhn = () =>
  chance.string({ alpha: true, casing: 'upper', length: 4 }) +
  chance.string({ length: 6, numeric: true });

const randomSex = () => chance.gender({ extraGenders: ['other', 'unknown'] }).toLocaleLowerCase();

export const randomTestPatient = () => ({
  id: chance.guid(),
  sex: randomSex(),
  encounterId: chance.guid(),
  encounterType: randomEncounterType(),
  markedForSync: chance.bool(),
  displayId: randomNhn(),
  firstName: chance.first(),
  middleName: chance.first(),
  lastName: chance.last(),
  culturalName: chance.last(),
  dateOfBirth: randomIsoDobString(),
  visibilityStatus: randomVisibilityStatus(),
  updatedAtSyncTick: '-999',
  createdAt: chance.date().toISOString(),
  updatedAt: chance.date().toISOString(),
});
