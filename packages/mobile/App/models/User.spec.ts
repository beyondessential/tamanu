import { AbilityBuilder, PureAbility } from '@casl/ability';
import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { CAN_ACCESS_ALL_FACILITIES, SETTINGS_SCOPES } from '~/constants';
import { fakeUser } from '/root/tests/helpers/fake';

// Facility sensitivity is network membership, and allowedFacilityIds is the only reader of it on
// mobile. Filtering it wrongly hands a user a sensitive facility, or hides an ordinary one.
// spec: specs/sync/sensitive-networks.md
describe('User.allowedFacilityIds', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.UserFacility.clear();
    await Database.models.Facility.clear();
    await Database.models.SensitiveNetwork.clear();
    await Database.models.User.clear();
    await Database.models.Setting.clear();
  });

  const buildAbility = (canLogin: boolean) => {
    const { can, build } = new AbilityBuilder(PureAbility);
    if (canLogin) can('login', 'Facility');
    return build();
  };

  const createNetwork = async () => {
    const id = `sensitiveNetwork-${uuidv4()}`;
    await Database.models.SensitiveNetwork.save({ id, code: id, name: id });
    return id;
  };

  const createFacility = async (sensitiveNetworkId: string | null = null) => {
    const id = `facility-${uuidv4()}`;
    await Database.models.Facility.save({
      id,
      code: id,
      name: id,
      ...(sensitiveNetworkId ? { sensitiveNetwork: { id: sensitiveNetworkId } } : {}),
    });
    return id;
  };

  // Reloaded rather than used as saved: allowedFacilityIds is an instance method, so the test
  // needs a hydrated entity rather than the plain object save() hands back.
  const createUser = async () => {
    const { id } = fakeUser();
    await Database.models.User.save({ ...fakeUser(), id });
    return Database.models.User.getRepository().findOneOrFail({ where: { id } });
  };

  const linkUserToFacility = async (userId: string, facilityId: string) =>
    Database.models.UserFacility.save({
      id: `${userId};${facilityId}`,
      user: { id: userId },
      facility: { id: facilityId },
    });

  // restrictUsersToFacilities unset leaves hasAllNonSensitiveFacilityAccess true.
  it('reaches every facility without enumeration when none belongs to a network', async () => {
    await createFacility();
    await createFacility();
    const user = await createUser();

    const allowed = await user.allowedFacilityIds(buildAbility(false), Database.models);

    expect(allowed).toBe(CAN_ACCESS_ALL_FACILITIES);
  });

  it('reaches every non-networked facility plus explicit links once a facility is networked', async () => {
    const network = await createNetwork();
    const sensitive = await createFacility(network);
    const ordinary = await createFacility();
    const user = await createUser();
    await linkUserToFacility(user.id, ordinary);

    const allowed = await user.allowedFacilityIds(buildAbility(false), Database.models);

    expect(allowed).not.toBe(CAN_ACCESS_ALL_FACILITIES);
    expect(allowed).toContain(ordinary);
    expect(allowed).not.toContain(sensitive);
  });

  it('gains no access to a network sibling from a link to one of its members', async () => {
    const network = await createNetwork();
    const linked = await createFacility(network);
    const sibling = await createFacility(network);
    const user = await createUser();
    await linkUserToFacility(user.id, linked);

    const allowed = await user.allowedFacilityIds(buildAbility(false), Database.models);

    expect(allowed).toContain(linked);
    expect(allowed).not.toContain(sibling);
  });

  it('reaches exactly the explicit links when restricted, networked or not', async () => {
    await Database.models.Setting.save({
      id: `setting-${uuidv4()}`,
      key: 'auth.restrictUsersToFacilities',
      value: 'true',
      scope: SETTINGS_SCOPES.GLOBAL,
    });
    const network = await createNetwork();
    const sensitive = await createFacility(network);
    const ordinary = await createFacility();
    await createFacility();
    const user = await createUser();
    await linkUserToFacility(user.id, sensitive);
    await linkUserToFacility(user.id, ordinary);

    const allowed = await user.allowedFacilityIds(buildAbility(false), Database.models);

    expect([...allowed].sort()).toEqual([sensitive, ordinary].sort());
  });
});
