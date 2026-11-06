import {
  ATTEMPTS_BEFORE_MANUAL_FALLBACK,
  buildPackageUrl,
  downloadProportion,
  hasEnoughSpace,
  retryDelay,
  shouldOfferManualFallback,
} from './updatePolicy';

describe('updatePolicy', () => {
  describe('retryDelay', () => {
    it('does not wait before the first attempt', () => {
      expect(retryDelay(0)).toBe(0);
    });

    it('lengthens the gap with each failure', () => {
      expect(retryDelay(2)).toBeGreaterThan(retryDelay(1));
      expect(retryDelay(3)).toBeGreaterThan(retryDelay(2));
    });

    it('settles at five minutes rather than growing without limit', () => {
      const fiveMinutes = 5 * 60 * 1000;
      expect(retryDelay(50)).toBe(fiveMinutes);
      expect(retryDelay(500)).toBe(fiveMinutes);
    });
  });

  describe('shouldOfferManualFallback', () => {
    it('keeps the manual address hidden while automatic retries are still worth having', () => {
      expect(shouldOfferManualFallback(0)).toBe(false);
      expect(shouldOfferManualFallback(ATTEMPTS_BEFORE_MANUAL_FALLBACK - 1)).toBe(false);
    });

    it('offers the manual address once attempts have had a fair go', () => {
      expect(shouldOfferManualFallback(ATTEMPTS_BEFORE_MANUAL_FALLBACK)).toBe(true);
      expect(shouldOfferManualFallback(ATTEMPTS_BEFORE_MANUAL_FALLBACK + 1)).toBe(true);
    });
  });

  describe('hasEnoughSpace', () => {
    it('requires room for the package and for installing it', () => {
      expect(hasEnoughSpace(250, 100)).toBe(true);
      // Enough for the download alone, but not for Android to unpack it.
      expect(hasEnoughSpace(150, 100)).toBe(false);
    });

    it('accepts exactly twice the package size', () => {
      expect(hasEnoughSpace(200, 100)).toBe(true);
    });
  });

  describe('buildPackageUrl', () => {
    it('adds the branding the server does not know about', () => {
      expect(buildPackageUrl('https://meta.tamanu.app/versions/~2.68.0/mobile/package', 'tamanu')).toBe(
        'https://meta.tamanu.app/versions/~2.68.0/mobile/package?branding=tamanu',
      );
    });

    it('appends to an address that already carries a query', () => {
      expect(buildPackageUrl('https://example.com/package?channel=beta', 'tamanu')).toBe(
        'https://example.com/package?channel=beta&branding=tamanu',
      );
    });

    it('escapes a branding that would otherwise alter the address', () => {
      expect(buildPackageUrl('https://example.com/package', 'a&b=c')).toBe(
        'https://example.com/package?branding=a%26b%3Dc',
      );
    });
  });

  describe('downloadProportion', () => {
    it('reports no proportion while the server has declared no size', () => {
      expect(downloadProportion(1000, -1)).toBeNull();
      expect(downloadProportion(1000, 0)).toBeNull();
    });

    it('reports how much of the package is downloaded', () => {
      expect(downloadProportion(250, 1000)).toBe(0.25);
    });

    it('never exceeds the whole package', () => {
      expect(downloadProportion(1200, 1000)).toBe(1);
    });
  });
});
