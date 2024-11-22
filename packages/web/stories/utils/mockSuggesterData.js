import Chance from 'chance';
const chance = new Chance();

export const createDummySuggesterEntity = prefix => ({
  id: chance.guid(),
  name: `${prefix}: ${chance.word()}`,
});

export const createDummyPatient = () => ({
  firstName: chance.first(),
  lastName: chance.last(),
  displayId: chance.ssn({ dashes: false }),
  dateOfBirth: chance.birthday({ string: true }),
  sex: chance.gender(),
  id: chance.guid(),
});

export const mockSuggesterEndpoint = suggesterData => ({ q }) =>
  suggesterData.filter(({ name }) => name.includes(q));

export const mockPatientData = [...Array(10)].map(() => createDummyPatient());
export const mockPatientSuggesterEndpoint = {
  'suggestions/patient': () => mockPatientData,
};

export const mockLocationGroupData = [...Array(10)].map(() =>
  createDummySuggesterEntity('Location group'),
);
export const mockLocationGroupSuggesterEndpoint = {
  'suggestions/facilityLocationGroup': mockSuggesterEndpoint(mockLocationGroupData),
};

export const mockLocationData = [...Array(10)].map(() => createDummySuggesterEntity('Location'));
export const mockLocationSuggesterEndpoint = {
  'suggestions/location': mockSuggesterEndpoint(mockLocationData),
};
