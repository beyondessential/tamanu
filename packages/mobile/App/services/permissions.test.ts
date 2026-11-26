import mitt from 'mitt';
import type { AuthService } from './auth';
import { readConfig, removeConfig, writeConfig } from './config';
import { PermissionsService } from './permissions';

jest.mock('./config', () => ({
  readConfig: jest.fn(),
  writeConfig: jest.fn(),
  removeConfig: jest.fn(),
}));

const nursePermissions = [{ verb: 'read', noun: 'Patient' }];
const clinicianPermissions = [
  { verb: 'read', noun: 'Patient' },
  { verb: 'read', noun: 'LabTestResult' },
];

describe('PermissionsService', () => {
  let auth: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    auth = { emitter: mitt() } as unknown as AuthService;
  });

  it('keeps each user’s permissions from their own online sign-in', async () => {
    (readConfig as jest.Mock).mockResolvedValue(null);
    const permissions = new PermissionsService(auth);
    await permissions.loaded;

    auth.emitter.emit('remoteSignIn', { user: { id: 'nurse' }, permissions: nursePermissions });
    auth.emitter.emit('remoteSignIn', {
      user: { id: 'clinician' },
      permissions: clinicianPermissions,
    });

    expect(permissions.getForUser('nurse')).toEqual(nursePermissions);
    expect(permissions.getForUser('clinician')).toEqual(clinicianPermissions);
    expect(permissions.getForUser('never-online')).toBeUndefined();
    expect(writeConfig).toHaveBeenLastCalledWith(
      'permissionsByUser',
      JSON.stringify({ nurse: nursePermissions, clinician: clinicianPermissions }),
    );
  });

  it('reads the permissions cached on the device', async () => {
    (readConfig as jest.Mock).mockResolvedValue(JSON.stringify({ nurse: nursePermissions }));
    const permissions = new PermissionsService(auth);
    await permissions.loaded;

    expect(readConfig).toHaveBeenCalledWith('permissionsByUser');
    expect(permissions.getForUser('nurse')).toEqual(nursePermissions);
    expect(permissions.getForUser('clinician')).toBeUndefined();
  });

  it('removes the device-wide permission list stored before per-user storage', () => {
    (readConfig as jest.Mock).mockResolvedValue(null);
    new PermissionsService(auth);

    expect(removeConfig).toHaveBeenCalledWith('permissions');
  });

  it('loads as empty when the stored value cannot be read', async () => {
    (readConfig as jest.Mock).mockResolvedValue('{not json');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const permissions = new PermissionsService(auth);
    await permissions.loaded;

    expect(permissions.getForUser('nurse')).toBeUndefined();
  });
});
