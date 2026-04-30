import {
  VERSION_COMPATIBILITY_ERRORS,
  VERSION_MAXIMUM_PROBLEM_KEY,
  VERSION_MINIMUM_PROBLEM_KEY,
} from '@tamanu/constants';
import { ClientIncompatibleError } from '@tamanu/errors';
import config from 'config';
import { buildVersionCompatibilityCheck } from '../../src/utils/buildVersionCompatibilityCheck';
import { log } from '../../src/services/logging';

jest.mock('config', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../src/services/logging', () => ({
  log: {
    error: jest.fn(),
  },
}));

function makeReq(headers = {}) {
  return {
    header: (name) => headers[name],
  };
}

function makeRes() {
  return {
    setHeader: jest.fn(),
  };
}

describe('buildVersionCompatibilityCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.updateUrls = undefined;
  });

  it('sets min/max headers when configured', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    check(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Min-Client-Version', '1.0.0');
    expect(res.setHeader).toHaveBeenCalledWith('X-Max-Client-Version', '2.0.0');
  });

  it('calls next when X-Version is missing (third-party / tests)', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({});
    const res = makeRes();
    const next = jest.fn();

    check(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows a client version inside [min, max]', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({ 'X-Version': '1.5.0' });
    const res = makeRes();
    const next = jest.fn();

    check(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows client exactly at min and max', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');

    for (const version of ['1.0.0', '2.0.0']) {
      const next = jest.fn();
      check(makeReq({ 'X-Version': version }), makeRes(), next);
      expect(next).toHaveBeenCalledWith();
    }
  });

  it('throws ClientIncompatibleError when client is below min', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({ 'X-Version': '0.9.9' });
    const res = makeRes();
    const next = jest.fn();

    expect(() => check(req, res, next)).toThrow(ClientIncompatibleError);
    expect(next).not.toHaveBeenCalled();
  });

  it('includes minimum and maximum keys on LOW error', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({ 'X-Version': '0.9.9' });
    const res = makeRes();
    const next = jest.fn();

    try {
      check(req, res, next);
    } catch (e) {
      expect(e).toBeInstanceOf(ClientIncompatibleError);
      expect(e.message).toBe(VERSION_COMPATIBILITY_ERRORS.LOW);
      expect(e.extraData[VERSION_MINIMUM_PROBLEM_KEY]).toBe('1.0.0');
      expect(e.extraData[VERSION_MAXIMUM_PROBLEM_KEY]).toBe('2.0.0');
      return;
    }
    throw new Error('expected ClientIncompatibleError');
  });

  it('throws ClientIncompatibleError when client is above max by more than a patch', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({ 'X-Version': '2.1.0' });
    const res = makeRes();
    const next = jest.fn();

    expect(() => check(req, res, next)).toThrow(ClientIncompatibleError);
    expect(next).not.toHaveBeenCalled();
  });

  it('includes minimum and maximum keys on HIGH error', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({ 'X-Version': '2.1.0' });
    const res = makeRes();
    const next = jest.fn();

    try {
      check(req, res, next);
    } catch (e) {
      expect(e.message).toBe(VERSION_COMPATIBILITY_ERRORS.HIGH);
      expect(e.extraData[VERSION_MINIMUM_PROBLEM_KEY]).toBe('1.0.0');
      expect(e.extraData[VERSION_MAXIMUM_PROBLEM_KEY]).toBe('2.0.0');
      return;
    }
    throw new Error('expected ClientIncompatibleError');
  });

  it('allows client above max when only the patch segment is newer', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({ 'X-Version': '2.0.1' });
    const res = makeRes();
    const next = jest.fn();

    check(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(log.error).toHaveBeenCalledWith(
      'Allowing client v2.0.1 with higher patch than max supported v2.0.0 to connect',
    );
  });

  it('includes mobile updateUrl in LOW error extraData when configured', () => {
    config.updateUrls = {
      mobile: 'https://example.com/update?min={minVersion}',
    };

    const check = buildVersionCompatibilityCheck('1.0.0', '2.0.0');
    const req = makeReq({
      'X-Version': '0.1.0',
      'X-Tamanu-Client': 'Tamanu Mobile',
    });
    const res = makeRes();
    const next = jest.fn();

    try {
      check(req, res, next);
    } catch (e) {
      expect(e.extraData.updateUrl).toBe('https://example.com/update?min=1.0.0');
      return;
    }
    throw new Error('expected ClientIncompatibleError');
  });

  it('skips min check when min is falsy', () => {
    const check = buildVersionCompatibilityCheck(undefined, '2.0.0');
    const req = makeReq({ 'X-Version': '0.0.1' });
    const res = makeRes();
    const next = jest.fn();

    check(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('skips max check when max is falsy', () => {
    const check = buildVersionCompatibilityCheck('1.0.0', undefined);
    const req = makeReq({ 'X-Version': '99.0.0' });
    const res = makeRes();
    const next = jest.fn();

    check(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
