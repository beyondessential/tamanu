import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from '../permissions/rolesToPermissions';

export function disableHardcodedPermissionsForSuite() {
  beforeAll(() => {
    setHardcodedPermissionsUseForTestsOnly(false);
  });
  afterAll(() => {
    unsetUseHardcodedPermissionsUseForTestsOnly();
  });
}
