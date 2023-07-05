import bcrypt from 'bcrypt';

import { fake, chance } from 'shared/test-helpers';

import { createTestContext } from '../utilities';
import { changePassword } from '../../app/subCommands/user';

// mock 'read' and provide implementation
jest.mock('read');

const readSync = require('read');

readSync.mockImplementation((options, cb) => {
  cb(null, 'DefaultPassword');
});

describe('user', () => {
  let ctx;
  let User;
  beforeAll(async () => {
    ctx = await createTestContext();
    User = ctx.store.models.User;
  });
  afterAll(() => ctx.close());

  describe('changePassword', () => {
    it("changes a user's password", async () => {
      // arrange
      const email = chance.email();
      const initialUser = fake(User, { email });
      await User.create(initialUser);

      // act
      await changePassword({ email });

      // assert
      const { password: hashedPassword } = await User.scope('withPassword').findOne({
        where: { email },
      });
      await expect(bcrypt.compare('DefaultPassword', hashedPassword)).resolves.toBe(true);
    });

    it('ensures passwords match', async () => {
      // arrange
      const email = chance.email();
      await User.create(fake(User, { email }));
      readSync
        .mockImplementationOnce((options, cb) => {
          cb(null, 'TheseAre');
        })
        .mockImplementationOnce((options, cb) => {
          cb(null, 'NotTheSame');
        });

      // act
      await expect(changePassword({ email })).rejects.toThrow('Passwords must match');

      // assert
      const { password: hashedPassword } = await User.scope('withPassword').findOne({
        where: { email },
      });
      expect(await bcrypt.compare('DefaultPassword', hashedPassword)).toBe(false);
    });

    it("errors if it can't find a user", async () => {
      // arrange
      const email = chance.email();
      await User.create(fake(User, { email }));
      const wrongEmail = chance.email();

      // act
      await expect(changePassword({ email: wrongEmail })).rejects.toThrow(
        'Could not find a user with specified email',
      );

      // assert
      const { password: hashedPassword } = await User.scope('withPassword').findOne({
        where: { email },
      });
      expect(await bcrypt.compare('DefaultPassword', hashedPassword)).toBe(false);
    });
  });
});
