import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

export const createFacility = async ({
  models,
}: CommonParams): Promise<void> => {
  const { Facility } = models;
  await Facility.create(fake(Facility));
};
