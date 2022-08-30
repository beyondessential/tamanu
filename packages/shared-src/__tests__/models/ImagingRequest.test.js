import Chance from 'chance';
import { fake } from 'shared/test-helpers';
import { initDb } from '../initDb';

const chance = new Chance();

describe('ImagingRequest', () => {
  let context;
  beforeAll(async () => {
    context = await initDb({ testMode: true });
  });
  afterAll(() => context.sequelize.close());

  it('allows more than 255 characters in the results', async () => {
    // arrange
    const { ImagingRequest, User } = context.models;
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
