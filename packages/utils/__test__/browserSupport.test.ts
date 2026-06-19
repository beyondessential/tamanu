import { describe, expect, it } from 'vitest';
import { BROWSER_SUPPORT_POLICIES, PLATFORM_SUPPORT_POLICIES } from '@tamanu/constants';
import { decideBrowserSupport, type BrowserDescriptor } from '../src/browserSupport';

const CURRENT = { chromium: 146, firefox: 134, safari: 18 };

const desc = (overrides: Partial<BrowserDescriptor> = {}): BrowserDescriptor => ({
  browserName: 'Chrome',
  engineName: 'Blink',
  browserMajor: 146,
  chromiumMajor: 146,
  platformType: 'desktop',
  ...overrides,
});

const decide = (
  descriptor: BrowserDescriptor,
  {
    policy = BROWSER_SUPPORT_POLICIES.BLINK,
    versionsBack = 2,
    platformPolicy = PLATFORM_SUPPORT_POLICIES.TABLET,
  } = {},
) => decideBrowserSupport({ policy, versionsBack, platformPolicy, currentMajors: CURRENT, descriptor });

describe('decideBrowserSupport', () => {
  describe('platform policy (checked before browser)', () => {
    it.each([
      [PLATFORM_SUPPORT_POLICIES.DESKTOP, 'desktop', true],
      [PLATFORM_SUPPORT_POLICIES.DESKTOP, 'tablet', false],
      [PLATFORM_SUPPORT_POLICIES.DESKTOP, 'mobile', false],
      [PLATFORM_SUPPORT_POLICIES.TABLET, 'tablet', true],
      [PLATFORM_SUPPORT_POLICIES.TABLET, 'mobile', false],
      [PLATFORM_SUPPORT_POLICIES.ALL, 'mobile', true],
      [PLATFORM_SUPPORT_POLICIES.ALL, 'tv', true],
    ])('policy %s on %s device → allowed=%s', (platformPolicy, platformType, allowed) => {
      expect(decide(desc({ platformType }), { platformPolicy }).allowed).toBe(allowed);
    });

    it('reports reason "platform" when the device is blocked (even on a supported browser)', () => {
      expect(decide(desc({ platformType: 'mobile' }))).toEqual({
        allowed: false,
        reason: 'platform',
      });
    });
  });

  describe('chromium policy', () => {
    it('allows recent Chrome/Chromium/Edge', () => {
      for (const browserName of ['Chrome', 'Chromium', 'Microsoft Edge']) {
        expect(decide(desc({ browserName }), { policy: BROWSER_SUPPORT_POLICIES.CHROMIUM }).allowed).toBe(true);
      }
    });

    it('rejects branded Chromium browsers (Opera/Vivaldi) even when recent', () => {
      const opera = desc({ browserName: 'Opera', chromiumMajor: 146, browserMajor: 120 });
      expect(decide(opera, { policy: BROWSER_SUPPORT_POLICIES.CHROMIUM })).toEqual({
        allowed: false,
        reason: 'browser',
      });
    });
  });

  describe('blink policy', () => {
    it('allows any recent Blink browser regardless of brand', () => {
      const vivaldi = desc({ browserName: 'Vivaldi', chromiumMajor: 145, browserMajor: 6 });
      expect(decide(vivaldi, { policy: BROWSER_SUPPORT_POLICIES.BLINK }).allowed).toBe(true);
    });

    it('rejects non-Blink browsers', () => {
      const firefox = desc({ browserName: 'Firefox', engineName: 'Gecko', chromiumMajor: null, browserMajor: 134 });
      expect(decide(firefox, { policy: BROWSER_SUPPORT_POLICIES.BLINK })).toEqual({
        allowed: false,
        reason: 'browser',
      });
    });
  });

  describe('version floor (current - versionsBack), enforced per engine', () => {
    it('allows exactly versionsBack behind and blocks one older', () => {
      expect(decide(desc({ chromiumMajor: 144 })).allowed).toBe(true); // 146 - 2
      expect(decide(desc({ chromiumMajor: 143 })).allowed).toBe(false);
    });

    it('versionsBack 0 allows only the current major', () => {
      expect(decide(desc({ chromiumMajor: 146 }), { versionsBack: 0 }).allowed).toBe(true);
      expect(decide(desc({ chromiumMajor: 145 }), { versionsBack: 0 }).allowed).toBe(false);
    });

    it('floors Firefox and Safari under the "all" tier', () => {
      const opts = { policy: BROWSER_SUPPORT_POLICIES.ALL };
      const ff = (browserMajor: number) =>
        desc({ browserName: 'Firefox', engineName: 'Gecko', chromiumMajor: null, browserMajor });
      const safari = (browserMajor: number) =>
        desc({ browserName: 'Safari', engineName: 'WebKit', chromiumMajor: null, browserMajor });
      expect(decide(ff(132), opts).allowed).toBe(true); // 134 - 2
      expect(decide(ff(131), opts).allowed).toBe(false);
      expect(decide(safari(16), opts).allowed).toBe(true); // 18 - 2
      expect(decide(safari(15), opts).allowed).toBe(false);
    });
  });

  describe('all (experimental) tier', () => {
    it('allows an unknown engine regardless of version (no data to floor)', () => {
      const unknown = desc({ browserName: 'Mystery', engineName: 'Goanna', chromiumMajor: null, browserMajor: 3 });
      expect(decide(unknown, { policy: BROWSER_SUPPORT_POLICIES.ALL }).allowed).toBe(true);
    });
  });
});
