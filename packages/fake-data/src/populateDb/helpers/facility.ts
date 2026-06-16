import { fake } from '../../fake/index.ts';
import type { CommonParams } from './common.ts';

export const createFacility = async ({
  models,
}: CommonParams): Promise<void> => {
  const { Facility } = models;
  await Facility.create(fake(Facility));
};
