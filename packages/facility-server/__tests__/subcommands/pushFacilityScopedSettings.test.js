import config from 'config';
import { CentralServerConnection } from '../../dist/sync/CentralServerConnection';
import { pushFacilityScopedSettings } from '../../dist/subCommands/pushFacilityScopedSettings';
import { createTestContext } from '../utilities';

import { SETTINGS_SCOPES } from '@tamanu/constants';

jest.mock('../../dist/subCommands/sync', () => ({
  triggerSyncWithContext: jest.fn(),
}));

describe('subcommands/pushFacilityScopedSettings', () => {
  let ctx = null;
  let models = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should push facility scoped settings to central server', async () => {
    const settings = {
      dog: {
        kennel: 'wooden',
        breed: 'farm collie',
        temperament: 'mostly friendly',
      },
      cat: {
        bed: 'cushion',
        coloring: 'calico',
        catches: [
          {
            name: 'rodent',
            type: 'field mouse',
            total: 3,
          },
          {
            name: 'bird',
            type: 'sparrow',
            total: 1,
          },
          {
            name: 'lizard',
            type: 'skink',
            total: 20,
          },
        ],
      },
    };
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    CentralServerConnection.mockImplementationOnce(() => ({
      __esModule: true,
      connect: jest.fn(async () => {}),

      forwardRequest: jest.fn(async (req, path) => {
        expect(path).toBe('/admin/settings');
        expect(req).toMatchObject({
          method: 'PUT',
          body: {
            settings,
            facilityId: config.serverFacilityId,
            scope: SETTINGS_SCOPES.FACILITY,
          },
        });
        return {
          code: 200,
        };
      }),
    }));

    await models.Setting.set('', settings, SETTINGS_SCOPES.FACILITY, config.serverFacilityId);
    await pushFacilityScopedSettings();
    expect(exitSpy).toBeCalledWith(0);
  });
  it('should exit with error if push fails', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    CentralServerConnection.mockImplementationOnce(() => ({
      __esModule: true,
      connect: jest.fn(async () => {}),
      forwardRequest: jest.fn(async () => {
        throw new Error('test failure');
      }),
    }));
    await pushFacilityScopedSettings();
    expect(exitSpy).toBeCalledWith(1);
  });
});
