import { Chance } from 'chance';

const chance = new Chance();

function fakeCountry() {
  const id = chance.guid();
  const country = chance.country({ full: true });
  return { id, name: country };
}

function fakeCity(locationGroup) {
  const id = chance.guid();
  const city = chance.city();
  const availability = chance.pickone(['AVAILABLE', 'RESERVED', 'OCCUPIED']);
  return { id, name: city, locationGroup, availability };
}

function fakeLabTestLaboratory() {
  const id = chance.guid();
  const name = `${chance.first()} ${chance.animal().toLowerCase()} laboratory`;
  return { id, name };
}

function fakeLabTestMethod() {
  const id = chance.guid();
  const name =`${chance.name_prefix()} ${chance.animal()} method`;
  return { id, name };
}

function fakeLabTestPriority() {
  const id = chance.guid();
  const adverb = chance.pickone([
    'Total',
    'Slight',
    'Critical',
    'Ultimate',
    'Untenable',
    'Stupefying',
    'Unknown',
    'Unknowable',
    'Unbelievable',
  ]);
  const noun = chance.pickone([
    'importance',
    'urgency',
    'criticality',
    'necessity',
    'seriousness',
    'danger',
  ]);
  return { id, name: `${adverb} ${noun}` };
}

function fakeLabTestCategory() {
  const id = chance.guid();
  const area = chance.pickone([
    'Blood',
    'Urine',
    'Stool',
    'Hormone',
    'Immunology',
    'Radiology',
    'Other',
  ]);
  const testSynonym = chance.pickone([
    'trial',
    'test',
    'analysis',
    'examination',
    'investigation',
    'screening',
    'diagnosis',
    'assessment',
    'analysis',
    'study',
  ]);
  return { id, name: `${area} ${testSynonym}` };
}

function fakeDepartment() {
  const id = chance.guid();
  const name = chance.pickone([
    'Emergency',
    'Surgery',
    'Pediatrics',
    'Obstetrics',
    'Gynecology',
    'Oncology',
    'Cardiology',
    'Neurology',
    'Psychiatry',
    'Radiology',
    'Pathology',
    'Dermatology',
    'Ophthalmology',
    'Otolaryngology',
    'Urology',
    'Orthopedics',
    'Anesthesiology',
  ]);
  return { id, name };
}

function fakePractitioner() {
  const id = chance.guid();
  const firstName = chance.first();
  const lastName = chance.last();
  const displayName = `${firstName} ${lastName}`;
  return { id, firstName, lastName, displayName };
}

export function fakeLabRequest() {
  const id = chance.guid();
  return {
    id,
    displayId: chance.integer({ min: 100000, max: 999999 }),
    requestedBy: fakePractitioner(),
    category: fakeLabTestCategory(),
    priority: fakeLabTestPriority(),
    department: fakeDepartment(),
    requestedDate: chance.date({ string: true }),
  };
}

export const fakeLocations = [];

for (let i = 0; i < 10; i++) {
  const country = fakeCountry();
  fakeLocations.push(country);

  for (let j = 0; j < 20; j++) {
    const city = fakeCity(country);
    fakeLocations.push(city);
  }
}

const eightCities = Array.from({ length: 8 }, fakeCity);
const sixCities = eightCities.slice(0, 6);

export const defaultEndpoints = {
  'suggestions/locationGroup/all': () => {
    return fakeLocations;
  },
  'suggestions/location': () => {
    return fakeLocations;
  },
  'suggestions/location/:id': (data, id) => {
    return fakeLocations.find(x => x.id === id);
  },
  'suggestions/labTestLaboratory/all': () => Array.from({ length: 10 }, fakeLabTestLaboratory),
  'suggestions/labTestPriority/all': () => Array.from({ length: 10 }, fakeLabTestPriority),
  'suggestions/labTestCategory/all': () => Array.from({ length: 10 }, fakeLabTestCategory),
  'suggestions/labTestMethod/all': () => Array.from({ length: 10 }, fakeLabTestMethod),
  'suggestions/lessThanSevenCities': () => sixCities,
  'suggestions/moreThanSevenCities': ({ q = '' }) =>
    eightCities.filter(city => city.name.toLowerCase().startsWith(q.toLowerCase())),
};
