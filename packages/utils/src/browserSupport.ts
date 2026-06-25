import {
  BROWSER_SUPPORT_POLICIES,
  PLATFORM_SUPPORT_POLICIES,
  type BrowserSupportPolicy,
  type PlatformSupportPolicy,
} from '@tamanu/constants';

// A parsed summary of the client's navigator, as produced by bowser on the web
// client. This is a UX gate, not a security boundary — the fields are trivially
// spoofable, so they're treated as advisory.
export interface BrowserDescriptor {
  browserName: string;
  engineName: string;
  // The browser's own product major (e.g. Firefox 130, Safari 17, Opera 120).
  browserMajor: number | null;
  // The underlying Chromium major from the Chrome/Chromium/HeadlessChrome UA
  // token, present for all Blink browsers regardless of their product version.
  chromiumMajor: number | null;
  // bowser's platform type: 'desktop' | 'tablet' | 'mobile' | 'tv' | ...
  platformType: string;
}

// Current latest major version per engine, resolved server-side from browserslist.
export interface CurrentBrowserMajors {
  chromium: number;
  firefox: number;
  safari: number;
}

export interface BrowserSupportDecision {
  allowed: boolean;
  // Why a browser was rejected, so the client can show the matching page.
  reason?: 'platform' | 'browser';
}

// bowser reports these names for the strict Chrome-family tier.
const CHROMIUM_BROWSER_NAMES = ['Chrome', 'Chromium', 'Microsoft Edge'];

const isPlatformAllowed = (platformPolicy: PlatformSupportPolicy, platformType: string): boolean => {
  switch (platformPolicy) {
    case PLATFORM_SUPPORT_POLICIES.DESKTOP:
      return platformType === 'desktop';
    case PLATFORM_SUPPORT_POLICIES.TABLET:
      return platformType === 'desktop' || platformType === 'tablet';
    case PLATFORM_SUPPORT_POLICIES.ALL:
      return true;
    default:
      return false;
  }
};

const isRecentEnough = (major: number | null, current: number, versionsBack: number): boolean =>
  typeof major === 'number' && Number.isFinite(major) && major >= current - versionsBack;

const isBrowserAllowed = (
  policy: BrowserSupportPolicy,
  versionsBack: number,
  currentMajors: CurrentBrowserMajors,
  descriptor: BrowserDescriptor,
): boolean => {
  const { engineName, browserName, browserMajor, chromiumMajor } = descriptor;
  const isBlink = engineName === 'Blink';

  switch (policy) {
    case BROWSER_SUPPORT_POLICIES.CHROMIUM:
      return (
        isBlink &&
        CHROMIUM_BROWSER_NAMES.includes(browserName) &&
        isRecentEnough(chromiumMajor, currentMajors.chromium, versionsBack)
      );
    case BROWSER_SUPPORT_POLICIES.BLINK:
      return isBlink && isRecentEnough(chromiumMajor, currentMajors.chromium, versionsBack);
    case BROWSER_SUPPORT_POLICIES.ALL:
      if (isBlink) return isRecentEnough(chromiumMajor, currentMajors.chromium, versionsBack);
      if (engineName === 'Gecko')
        return isRecentEnough(browserMajor, currentMajors.firefox, versionsBack);
      if (engineName === 'WebKit')
        return isRecentEnough(browserMajor, currentMajors.safari, versionsBack);
      // Unknown engine under the experimental tier: no version data to floor
      // against, so allow it (caveat emptor).
      return true;
    default:
      return false;
  }
};

const toMajor = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

// Normalise the untrusted request body sent by the web client into a descriptor.
export const parseBrowserDescriptor = (input: Record<string, unknown> = {}): BrowserDescriptor => ({
  browserName: String(input.browserName ?? ''),
  engineName: String(input.engineName ?? ''),
  browserMajor: toMajor(input.browserMajor),
  chromiumMajor: toMajor(input.chromiumMajor),
  platformType: String(input.platformType ?? ''),
});

// Pure, Node-free decision shared by both servers' public endpoints. Platform is
// checked before browser so a blocked mobile device gets the device message
// rather than a browser one.
export const decideBrowserSupport = ({
  policy,
  versionsBack,
  platformPolicy,
  currentMajors,
  descriptor,
}: {
  policy: BrowserSupportPolicy;
  versionsBack: number;
  platformPolicy: PlatformSupportPolicy;
  currentMajors: CurrentBrowserMajors;
  descriptor: BrowserDescriptor;
}): BrowserSupportDecision => {
  if (!isPlatformAllowed(platformPolicy, descriptor.platformType)) {
    return { allowed: false, reason: 'platform' };
  }
  if (!isBrowserAllowed(policy, versionsBack, currentMajors, descriptor)) {
    return { allowed: false, reason: 'browser' };
  }
  return { allowed: true };
};
