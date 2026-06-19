import Bowser from 'bowser';
import { MIN_CHROME_VERSION } from './env';

const CACHE_KEY = 'browserSupport';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Branded Chromium browsers report their own product version, but all carry the
// real Chromium major in a Chrome/Chromium/HeadlessChrome UA token (matches the
// static gate this falls back to — see App.jsx history).
const parseChromiumMajor = userAgent => {
  const match = /(?:HeadlessChrome|Chromium|Chrome)\/(\d+)/.exec(userAgent);
  return match ? Number(match[1]) : null;
};

const parseMajor = version => {
  const major = parseInt(version, 10);
  return Number.isFinite(major) ? major : null;
};

// The parsed navigator summary posted to the server for a support decision.
export const getBrowserDescriptor = () => {
  const userAgent = window.navigator.userAgent;
  const browser = Bowser.getParser(userAgent);
  return {
    browserName: browser.getBrowserName(),
    engineName: browser.getEngineName(),
    browserMajor: parseMajor(browser.getBrowserVersion()),
    chromiumMajor: parseChromiumMajor(userAgent),
    platformType: browser.getPlatformType(),
  };
};

// Fallback when the server can't be reached. Mirrors the default settings
// (platform `tablet` = desktop/laptop/tablet only, plus a recent Blink engine)
// so a network failure degrades to the same gate an unconfigured server applies,
// rather than letting through device types the default would block.
export const staticDecision = descriptor => {
  if (descriptor.platformType !== 'desktop' && descriptor.platformType !== 'tablet') {
    return { allowed: false, reason: 'platform' };
  }
  const isChromish =
    descriptor.engineName === 'Blink' &&
    descriptor.chromiumMajor !== null &&
    descriptor.chromiumMajor >= MIN_CHROME_VERSION;
  return isChromish ? { allowed: true } : { allowed: false, reason: 'browser' };
};

// djb2 — a tiny non-cryptographic hash, enough to key the cache by user agent so
// that a browser update re-queries the server.
const hashUserAgent = userAgent => {
  let hash = 5381;
  for (let i = 0; i < userAgent.length; i++) {
    hash = (((hash << 5) + hash) + userAgent.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
};

export const readCachedDecision = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!cached || cached.uaHash !== hashUserAgent(window.navigator.userAgent)) return null;
    if (Date.now() - cached.checkedAt >= CACHE_TTL_MS) return null;
    return { allowed: true };
  } catch {
    return null;
  }
};

export const writeCachedDecision = decision => {
  // Only persist allowed decisions: a blocked browser should re-query on every
  // load so a policy change that now permits it is picked up immediately.
  if (!decision.allowed) return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        uaHash: hashUserAgent(window.navigator.userAgent),
        allowed: true,
        checkedAt: Date.now(),
      }),
    );
  } catch {
    // ignore storage failures (private mode, quota) — we'll just re-query.
  }
};
