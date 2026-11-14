import { describe, expect, it } from 'vitest';

import {
  dedupeCentralEndpoints,
  isInternalHost,
  normaliseCentralEndpoint,
  parseCentralEndpoint,
} from '../src/centralEndpoint';

describe('isInternalHost', () => {
  it.each([
    'central',
    'localhost',
    'central.local',
    'central.example.internal',
    'central.lan',
    'central.home.arpa',
    'central.intranet',
    'central.corp',
    'central.private',
    'central.tailnet-name.ts.net',
    'CENTRAL.LOCAL',
    'central.',
  ])('treats %s as internal', host => {
    expect(isInternalHost(host)).toBe(true);
  });

  it.each([
    '10.0.0.1',
    '10.255.255.255',
    '127.0.0.1',
    '169.254.1.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '100.64.0.1',
    '100.127.255.255',
    '::1',
    '[::1]',
    'fd00::1',
    'fc00::1',
    'fd7a:115c:a1e0::1',
    'fe80::1',
    '::ffff:10.0.0.1',
    '[::ffff:a00:1]',
  ])('treats %s as internal', host => {
    expect(isInternalHost(host)).toBe(true);
  });

  it.each([
    'central.example.com',
    'tamanu.gov.fj',
    'internal.example.com',
    'notts.net',
    'local.example.com',
    '8.8.8.8',
    '172.15.0.1',
    '172.32.0.1',
    '100.63.255.255',
    '100.128.0.1',
    '11.0.0.1',
    '192.169.0.1',
    '2001:db8::1',
    '[2606:4700::1111]',
    '::ffff:8.8.8.8',
    '',
  ])('treats %s as public', host => {
    expect(isInternalHost(host)).toBe(false);
  });
});

describe('normaliseCentralEndpoint', () => {
  it('accepts https for any host', () => {
    expect(normaliseCentralEndpoint('https://central.example.com')).toEqual({
      isValid: true,
      endpoint: 'https://central.example.com',
    });
  });

  it('lowercases the host and drops a trailing slash', () => {
    expect(normaliseCentralEndpoint('https://Central.Example.COM/')).toEqual({
      isValid: true,
      endpoint: 'https://central.example.com',
    });
  });

  it('keeps a non-default port and drops the default one', () => {
    expect(normaliseCentralEndpoint('https://central.example.com:8443')).toMatchObject({
      endpoint: 'https://central.example.com:8443',
    });
    expect(normaliseCentralEndpoint('https://central.example.com:443')).toMatchObject({
      endpoint: 'https://central.example.com',
    });
  });

  it('accepts http for internal hosts', () => {
    expect(normaliseCentralEndpoint('http://central:3000')).toEqual({
      isValid: true,
      endpoint: 'http://central:3000',
    });
    expect(normaliseCentralEndpoint('http://100.64.1.2')).toMatchObject({ isValid: true });
    expect(normaliseCentralEndpoint('http://[fd7a:115c:a1e0::1]:3000')).toMatchObject({
      isValid: true,
      endpoint: 'http://[fd7a:115c:a1e0::1]:3000',
    });
  });

  it('rejects http for public hosts', () => {
    expect(normaliseCentralEndpoint('http://central.example.com')).toMatchObject({
      isValid: false,
    });
    expect(normaliseCentralEndpoint('http://8.8.8.8')).toMatchObject({ isValid: false });
  });

  it.each([
    ['a path', 'https://central.example.com/api'],
    ['a query', 'https://central.example.com?a=1'],
    ['an empty query', 'https://central.example.com?'],
    ['a fragment', 'https://central.example.com#x'],
    ['credentials', 'https://user:pass@central.example.com'],
    ['a username', 'https://user@central.example.com'],
    ['another scheme', 'ftp://central.example.com'],
    ['no scheme', 'central.example.com'],
    ['an empty string', ''],
    ['whitespace', '   '],
    ['garbage', 'not a url'],
  ])('rejects %s', (_, input) => {
    expect(normaliseCentralEndpoint(input)).toMatchObject({ isValid: false });
  });

  it('rejects non-string input', () => {
    expect(normaliseCentralEndpoint(undefined as unknown as string)).toMatchObject({
      isValid: false,
    });
  });
});

describe('dedupeCentralEndpoints', () => {
  it('drops later duplicates after normalisation and keeps order', () => {
    expect(
      dedupeCentralEndpoints([
        'https://a.example.com',
        'https://b.example.com/',
        'https://A.example.com/',
        'http://c.local',
      ]),
    ).toEqual(['https://a.example.com', 'https://b.example.com', 'http://c.local']);
  });

  it('drops invalid entries', () => {
    expect(dedupeCentralEndpoints(['nope', 'https://a.example.com'])).toEqual([
      'https://a.example.com',
    ]);
  });
});

describe('parseCentralEndpoint', () => {
  it('does not apply the plain-http policy', () => {
    expect(parseCentralEndpoint('http://central.example.com/')).toEqual({
      isValid: true,
      endpoint: 'http://central.example.com',
    });
  });

  it('still rejects structurally invalid endpoints', () => {
    expect(parseCentralEndpoint('https://central.example.com/api')).toMatchObject({
      isValid: false,
    });
    expect(parseCentralEndpoint('nope')).toMatchObject({ isValid: false });
  });
});
