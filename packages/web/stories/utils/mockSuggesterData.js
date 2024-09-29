import Chance from 'chance';
import { uniqueId } from 'lodash';
const chance = new Chance();

export const createDummyPatient = () => ({
  firstName: chance.first(),
  lastName: chance.last(),
  displayId: chance.ssn({ dashes: false }),
  dateOfBirth: chance.birthday({ string: true }),
  sex: chance.gender(),
  id: chance.guid(),
});

export const mockPatientSuggesterEndpoint = {
  'suggestions/patient': () => [...Array(10)].map(() => createDummyPatient()),
};

export const createDummySuggesterEntity = prefix => ({
  id: chance.guid(),
  name: `${prefix}: ${uniqueId()}`,
});

export const mockLocationGroupSuggesterEndpoint = {
  'suggestions/facilityLocationGroup': () =>
    [...Array(10)].map(() => createDummySuggesterEntity('Location group')),
};

export const mockLocationSuggesterEndpoint = {
  'suggestions/location': () => [...Array(10)].map(() => createDummySuggesterEntity('Location')),
};
