import { Chance } from 'chance';
import { VACCINE_CATEGORIES_VALUES } from '@tamanu/constants';
import { generateId } from '../utils/generateId';

const chance = new Chance();

export async function createScheduledVaccine(models, overrides = {}) {
  return {
    id: generateId(),
    category: chance.pickone(VACCINE_CATEGORIES_VALUES),
    label: chance.animal(),
    schedule: chance.pickone(['Dose 1', 'Dose 2', 'Dose 3']),
    ...overrides,
  };
}

export async function createAdministeredVaccine(models, overrides = {}) {
  return {
    id: generateId(),
    batch: chance.tv(),
    status: 'GIVEN',
    date: new Date(),
    ...overrides,
  };
}
