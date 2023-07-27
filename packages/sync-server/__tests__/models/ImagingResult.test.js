import { fake, chance } from 'shared/test-helpers';

import { createTestContext } from '../utilities';

describe('ImagingResult', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('allows more than 255 characters in the results', async () => {
    // arrange
    const { ImagingRequest, ImagingResult, User } = ctx.store.models;
    const description = chance.string({ length: 5000 });
    const { id: requestedById } = await User.create(fake(User));
    const ir = await ImagingRequest.create(fake(ImagingRequest, { requestedById }));

    // act
    const ires = await ImagingResult.create(
      fake(ImagingResult, { description, imagingRequestId: ir.id }),
    );

    // assert
    await expect(ires).toMatchObject({ description });
  });
});
