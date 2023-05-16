import { Chance } from "chance";

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
  const name = `${chance.first()} ${chance.animal().toLowerCase()} laboratory`
  return { id, name };
}

function fakeLabTestPriority() {
  const id = chance.guid();
  const adverb = chance.pickone(['Total', 'Slight', 'Critical', 'Ultimate', 'Bare', 'Unknown', 'Unknowable', 'Unbelievable']);
  const noun = chance.pickone(['importance', 'urgency', 'criticality', 'priority', 'seriousness', 'danger']);
  return { id, name: `${adverb} ${noun}` };
}

function fakeLabTestCategory() {
  const id = chance.guid();
  const area = chance.pickone(['Blood', 'Urine', 'Stool', 'Hormone', 'Immunology', 'Radiology', 'Other'])
  const testSynonym = chance.pickone(['trial', 'test', 'analysis', 'examination', 'investigation', 'screening', 'diagnosis', 'assessment', 'analysis', 'study'])
  return { id, name: `${area} ${testSynonym}` };
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

const eightCities = Array.from({ length: 8 }, fakeCity)
const sixCities = eightCities.slice(0, 6)

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
  'suggestions/lessThanSevenCities': () => sixCities ,
  'suggestions/moreThanSevenCities': ({q=''}) => eightCities.filter(city => city.name.toLowerCase().startsWith(q.toLowerCase())),
};
