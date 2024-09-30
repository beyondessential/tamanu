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

const mockPatientData = [...Array(10)].map(() => createDummyPatient());

export const mockPatientSuggesterEndpoint = {
  'suggestions/patient': () => mockPatientData,
};

export const createDummySuggesterEntity = prefix => ({
  id: chance.guid(),
  name: `${prefix}: ${uniqueId()}`,
});

const mockLocationGroupData = [...Array(10)].map(() =>
  createDummySuggesterEntity('Location group'),
);

export const mockLocationGroupSuggesterEndpoint = {
  'suggestions/facilityLocationGroup': () => mockLocationGroupData,
};

const mockLocationData = [...Array(10)].map(() => createDummySuggesterEntity('Location'));

export const mockLocationSuggesterEndpoint = {
  'suggestions/location': () => mockLocationData,
};
