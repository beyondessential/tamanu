import { ForbiddenError } from '@tamanu/errors';
import { requireHttps } from '../../src/utils/requireHttps';

// req.settings on the central server is a single ReadSettings-like object.
function centralSettings(requireHttpsValue) {
  return { get: jest.fn(async () => requireHttpsValue) };
}

// req.settings on the facility server is a map of facilityId -> ReadSettings-like object.
function facilitySettings(...requireHttpsValues) {
  return Object.fromEntries(
    requireHttpsValues.map((value, index) => [
      `facility-${index}`,
      { get: jest.fn(async () => value) },
    ]),
  );
}

function makeReq({ secure, settings }) {
  return { secure, settings };
}

describe('requireHttps', () => {
  it('allows HTTPS requests regardless of the setting', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: true, settings: centralSettings(true) }), {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows plain HTTP requests when the setting is off (central)', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: centralSettings(false) }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects plain HTTP requests with ForbiddenError when the setting is on (central)', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: centralSettings(true) }), {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('rejects plain HTTP on a facility server when the setting is on for its facility', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: facilitySettings(true) }), {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('rejects plain HTTP when any hosted facility requires HTTPS', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: facilitySettings(false, true) }), {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('allows plain HTTP when no hosted facility requires HTTPS', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: facilitySettings(false, false) }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows the request when settings are unavailable (pre-settings routes)', async () => {
    const next = jest.fn();
    await requireHttps(makeReq({ secure: false, settings: undefined }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes read errors to next instead of throwing', async () => {
    const next = jest.fn();
    const settings = { get: jest.fn(async () => { throw new Error('db down'); }) };
    await requireHttps(makeReq({ secure: false, settings }), {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe('db down');
  });
});
