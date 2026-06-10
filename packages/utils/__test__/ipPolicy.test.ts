import { ipMatchesCidrList, isValidCidr } from '../src/ipPolicy';
import { describe, expect, it } from 'vitest';

describe('ipMatchesCidrList', () => {
  it('matches IPv4 inside a range and not outside', () => {
    expect(ipMatchesCidrList('10.1.2.3', ['10.0.0.0/8'])).toBe(true);
    expect(ipMatchesCidrList('11.1.2.3', ['10.0.0.0/8'])).toBe(false);
    expect(ipMatchesCidrList('192.168.1.50', ['10.0.0.0/8', '192.168.1.0/24'])).toBe(true);
  });

  it('matches an exact /32', () => {
    expect(ipMatchesCidrList('203.0.113.7', ['203.0.113.7/32'])).toBe(true);
    expect(ipMatchesCidrList('203.0.113.8', ['203.0.113.7/32'])).toBe(false);
  });

  it('matches IPv6 ranges', () => {
    expect(ipMatchesCidrList('2001:db8::1', ['2001:db8::/32'])).toBe(true);
    expect(ipMatchesCidrList('2001:db9::1', ['2001:db8::/32'])).toBe(false);
  });

  it('unwraps IPv4-mapped IPv6 client addresses', () => {
    // Node reports v4 clients this way on dual-stack sockets
    expect(ipMatchesCidrList('::ffff:10.1.2.3', ['10.0.0.0/8'])).toBe(true);
    expect(ipMatchesCidrList('::ffff:11.1.2.3', ['10.0.0.0/8'])).toBe(false);
  });

  it('does not cross address families', () => {
    expect(ipMatchesCidrList('10.1.2.3', ['2001:db8::/32'])).toBe(false);
    expect(ipMatchesCidrList('2001:db8::1', ['10.0.0.0/8'])).toBe(false);
  });

  it('fails closed on garbage', () => {
    // unparsable client IP never matches
    expect(ipMatchesCidrList('not-an-ip', ['10.0.0.0/8'])).toBe(false);
    expect(ipMatchesCidrList(undefined, ['10.0.0.0/8'])).toBe(false);
    // malformed CIDR entries never match, valid siblings still do
    expect(ipMatchesCidrList('10.1.2.3', ['garbage'])).toBe(false);
    expect(ipMatchesCidrList('10.1.2.3', ['garbage', '10.0.0.0/8'])).toBe(true);
    // empty list matches nothing
    expect(ipMatchesCidrList('10.1.2.3', [])).toBe(false);
    expect(ipMatchesCidrList('10.1.2.3', undefined)).toBe(false);
  });
});

describe('isValidCidr', () => {
  it('accepts well-formed CIDRs and rejects the rest', () => {
    expect(isValidCidr('10.0.0.0/8')).toBe(true);
    expect(isValidCidr('2001:db8::/32')).toBe(true);
    expect(isValidCidr('10.0.0.0')).toBe(false); // bare IP, no prefix
    expect(isValidCidr('10.0.0.0/33')).toBe(false);
    expect(isValidCidr('banana')).toBe(false);
  });
});
