import Chance from 'chance';
import { fake } from 'shared/test-helpers';

import { createTestContext } from '../utilities';

const chance = new Chance();

describe('ImagingRequest', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('allows more than 255 characters in the results', async () => {
    // arrange
    const { ImagingRequest, User } = ctx.store.models;
    const results = chance.string({ length: 5000 });
    const { id: requestedById } = await User.create(fake(User));

    // act
    const irPromise = ImagingRequest.create({
      ...fake(ImagingRequest),
      results,
      requestedById,
    });

    // assert
    await expect(irPromise).resolves.toMatchObject({ results });
  });
});
