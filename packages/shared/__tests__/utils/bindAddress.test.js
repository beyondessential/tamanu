import { parseBindAddress, resolveBindAddresses } from '../../src/utils/bindAddress';

describe('parseBindAddress', () => {
  it('parses a bare port', () => {
    expect(parseBindAddress('3000')).toEqual({ host: undefined, port: 3000 });
  });

  it('parses a bare port with a leading colon', () => {
    expect(parseBindAddress(':3000')).toEqual({ host: undefined, port: 3000 });
  });

  it('parses an IPv4 host and port', () => {
    expect(parseBindAddress('127.0.0.1:8080')).toEqual({ host: '127.0.0.1', port: 8080 });
  });

  it('parses a bracketed IPv6 host and port', () => {
    expect(parseBindAddress('[::1]:8080')).toEqual({ host: '::1', port: 8080 });
    expect(parseBindAddress('[2001:db8::1]:443')).toEqual({ host: '2001:db8::1', port: 443 });
  });

  it('trims surrounding whitespace', () => {
    expect(parseBindAddress('  127.0.0.1:8080  ')).toEqual({ host: '127.0.0.1', port: 8080 });
  });

  it('throws on a non-numeric port', () => {
    expect(() => parseBindAddress('127.0.0.1:abc')).toThrow();
  });

  it('throws on a malformed bracketed IPv6 address', () => {
    expect(() => parseBindAddress('[::1:8080')).toThrow(); // missing closing bracket
    expect(() => parseBindAddress('[::1]8080')).toThrow(); // missing colon after bracket
  });
});

describe('resolveBindAddresses', () => {
  const { BIND_ADDRESS, PORT } = process.env;

  afterEach(() => {
    if (BIND_ADDRESS === undefined) delete process.env.BIND_ADDRESS;
    else process.env.BIND_ADDRESS = BIND_ADDRESS;
    if (PORT === undefined) delete process.env.PORT;
    else process.env.PORT = PORT;
  });

  it('falls back to the config port when neither env var is set', () => {
    delete process.env.BIND_ADDRESS;
    delete process.env.PORT;
    expect(resolveBindAddresses(4000)).toEqual([{ host: undefined, port: 4000 }]);
  });

  it('uses PORT over the fallback', () => {
    delete process.env.BIND_ADDRESS;
    process.env.PORT = '5000';
    expect(resolveBindAddresses(4000)).toEqual([{ host: undefined, port: 5000 }]);
  });

  it('uses BIND_ADDRESS over PORT and the fallback', () => {
    process.env.BIND_ADDRESS = '127.0.0.1:9000';
    process.env.PORT = '5000';
    expect(resolveBindAddresses(4000)).toEqual([{ host: '127.0.0.1', port: 9000 }]);
  });

  it('parses a comma-separated list of listeners', () => {
    process.env.BIND_ADDRESS = '127.0.0.1:9000, [::1]:9000 ,:9001';
    delete process.env.PORT;
    expect(resolveBindAddresses(4000)).toEqual([
      { host: '127.0.0.1', port: 9000 },
      { host: '::1', port: 9000 },
      { host: undefined, port: 9001 },
    ]);
  });
});
