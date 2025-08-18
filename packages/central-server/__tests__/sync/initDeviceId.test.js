import config from 'config';
import { FACT_DEVICE_ID } from '@tamanu/constants/facts';
import { initDeviceId } from '../../app/sync/initDeviceId';

// Mock config
jest.mock('config', () => ({
  deviceId: null,
}));

describe('initDeviceId', () => {
  let mockContext;
  let mockLocalSystemFact;

  beforeEach(() => {
    mockLocalSystemFact = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockContext = {
      store: {
        models: {
          LocalSystemFact: mockLocalSystemFact,
        },
      },
      deviceId: null,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set deviceId from config when available', async () => {
    const configDeviceId = 'test-device-123';
    config.deviceId = configDeviceId;
    mockLocalSystemFact.get.mockResolvedValue(null);

    await initDeviceId(mockContext);

    expect(mockLocalSystemFact.set).toHaveBeenCalledWith(FACT_DEVICE_ID, configDeviceId);
    expect(mockContext.deviceId).toBe(configDeviceId);
  });

  it('should generate a new deviceId when none exists and no config', async () => {
    config.deviceId = null;
    mockLocalSystemFact.get.mockResolvedValue(null);

    await initDeviceId(mockContext);

    expect(mockLocalSystemFact.set).toHaveBeenCalledWith(
      FACT_DEVICE_ID,
      expect.stringMatching(/^central-/),
    );
    expect(mockContext.deviceId).toMatch(/^central-/);
  });

  it('should use existing deviceId from database when available', async () => {
    const existingDeviceId = 'existing-device-456';
    config.deviceId = null;
    mockLocalSystemFact.get.mockResolvedValue(existingDeviceId);

    await initDeviceId(mockContext);

    expect(mockLocalSystemFact.set).not.toHaveBeenCalled();
    expect(mockContext.deviceId).toBe(existingDeviceId);
  });

  it('should throw error when deviceId mismatch between config and database', async () => {
    const configDeviceId = 'config-device-789';
    const dbDeviceId = 'db-device-999';
    config.deviceId = configDeviceId;
    mockLocalSystemFact.get.mockResolvedValue(dbDeviceId);

    await expect(initDeviceId(mockContext)).rejects.toThrow(
      `Device ID mismatch: ${dbDeviceId} (from database) vs ${configDeviceId} (from config)`,
    );
  });

  it('should use config deviceId when it matches database', async () => {
    const deviceId = 'matching-device-123';
    config.deviceId = deviceId;
    mockLocalSystemFact.get.mockResolvedValue(deviceId);

    await initDeviceId(mockContext);

    expect(mockLocalSystemFact.set).not.toHaveBeenCalled();
    expect(mockContext.deviceId).toBe(deviceId);
  });
});
