import { originIsUnderRpId } from '../../src/auth/webauthn';

describe('originIsUnderRpId', () => {
  it('matches the stem itself', () => {
    expect(originIsUnderRpId('foo.bar.com', 'foo.bar.com')).toBe(true);
  });

  it('matches subdomains of the stem', () => {
    expect(originIsUnderRpId('central.foo.bar.com', 'foo.bar.com')).toBe(true);
    expect(originIsUnderRpId('facility-a.foo.bar.com', 'foo.bar.com')).toBe(true);
    expect(originIsUnderRpId('deep.nested.foo.bar.com', 'foo.bar.com')).toBe(true);
  });

  it('only matches on label boundaries', () => {
    // a naïve endsWith would wrongly accept this
    expect(originIsUnderRpId('evilfoo.bar.com', 'foo.bar.com')).toBe(false);
  });

  it('rejects unrelated domains', () => {
    expect(originIsUnderRpId('facility.other.com', 'foo.bar.com')).toBe(false);
    expect(originIsUnderRpId('bar.com', 'foo.bar.com')).toBe(false);
  });

  it('accepts full URLs and strips ports', () => {
    expect(originIsUnderRpId('https://central.foo.bar.com', 'foo.bar.com')).toBe(true);
    expect(originIsUnderRpId('https://central.foo.bar.com:8443/api', 'foo.bar.com')).toBe(true);
    expect(originIsUnderRpId('central.foo.bar.com:8443', 'foo.bar.com')).toBe(true);
    expect(originIsUnderRpId('http://localhost:3000', 'foo.bar.com')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(originIsUnderRpId('Central.Foo.BAR.com', 'foo.bar.COM')).toBe(true);
  });

  it('treats an empty rpid as WebAuthn-disabled', () => {
    expect(originIsUnderRpId('central.foo.bar.com', '')).toBe(false);
    expect(originIsUnderRpId('central.foo.bar.com', undefined)).toBe(false);
    expect(originIsUnderRpId('central.foo.bar.com', '   ')).toBe(false);
  });

  it('rejects empty or malformed origins', () => {
    expect(originIsUnderRpId('', 'foo.bar.com')).toBe(false);
    expect(originIsUnderRpId(undefined, 'foo.bar.com')).toBe(false);
    expect(originIsUnderRpId('http://', 'foo.bar.com')).toBe(false);
  });
});
