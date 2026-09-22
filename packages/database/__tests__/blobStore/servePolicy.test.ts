import { describe, expect, it } from 'vitest';

import {
  BLOB_AVAILABILITY_STATES,
  BLOB_SCAN_VERDICTS,
  BLOB_SERVE_POLICIES,
} from '@tamanu/constants';

import { blobWithholdReason } from '../../src/blobStore/scanning/servePolicy';

const decide = (overrides: Partial<Parameters<typeof blobWithholdReason>[0]>) =>
  blobWithholdReason({
    scanVerdict: null,
    quarantined: false,
    policy: BLOB_SERVE_POLICIES.UNLESS_KNOWN_BAD,
    scans: true,
    ...overrides,
  });

describe('blobWithholdReason', () => {
  // verifies spec: AV — with the policy off, blobs are served subject only to
  // access control, so a verdict is recorded but never acted on
  describe('off', () => {
    const policy = BLOB_SERVE_POLICIES.OFF;

    it.each([
      ['unscanned', { scanVerdict: null }],
      ['clean', { scanVerdict: BLOB_SCAN_VERDICTS.CLEAN }],
      ['infected', { scanVerdict: BLOB_SCAN_VERDICTS.INFECTED }],
    ])('serves %s content', (_label, overrides) => {
      expect(decide({ policy, ...overrides })).toBeNull();
    });

    // verifies spec: AV — a quarantine is the deployment's standing record of
    // confirmed malware rather than one server's verdict, so the posture that
    // holds back enforcement of verdicts does not license serving it
    it('still withholds quarantined content', () => {
      expect(decide({ policy, quarantined: true })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });
  });

  // verifies spec: AV — serve-unless-known-bad serves any blob that does not
  // have an infected verdict, including not-yet-scanned content
  describe('unless known bad', () => {
    const policy = BLOB_SERVE_POLICIES.UNLESS_KNOWN_BAD;

    it('serves not-yet-scanned content', () => {
      expect(decide({ policy, scanVerdict: null })).toBeNull();
    });

    it('withholds an infected verdict', () => {
      expect(decide({ policy, scanVerdict: BLOB_SCAN_VERDICTS.INFECTED })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });

    // verifies spec: AV — quarantine is content-addressed and propagates, so a
    // server that never scanned the content still withholds it
    it('withholds a hash quarantined elsewhere, unscanned here', () => {
      expect(decide({ policy, scanVerdict: null, quarantined: true, scans: false })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });
  });

  // verifies spec: AV — serve-only-when-known-good serves a blob only once it
  // has a clean verdict; not-yet-scanned content is withheld until scanned
  describe('only known good', () => {
    const policy = BLOB_SERVE_POLICIES.ONLY_KNOWN_GOOD;

    it('serves content scanned clean', () => {
      expect(decide({ policy, scanVerdict: BLOB_SCAN_VERDICTS.CLEAN })).toBeNull();
    });

    it('withholds not-yet-scanned content as awaiting its scan', () => {
      expect(decide({ policy, scanVerdict: null })).toBe(BLOB_AVAILABILITY_STATES.AWAITING_SCAN);
    });

    it('withholds an infected verdict as infected rather than as pending', () => {
      expect(decide({ policy, scanVerdict: BLOB_SCAN_VERDICTS.INFECTED })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });

    // verifies spec: AV — a server without a scanner of its own holds no
    // verdicts, so it serves on central's known-bad records rather than
    // withholding everything it has
    it('falls back to unless-known-bad on a server that runs no scanner', () => {
      expect(decide({ policy, scanVerdict: null, scans: false })).toBeNull();
      expect(decide({ policy, quarantined: true, scans: false })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });

    // verifies spec: AV — content the server does not hold cannot be waited on
    // for a verdict: the scan reads what is on disk, so withholding it before
    // it is fetched would keep it from ever being fetched or scanned
    it('does not withhold content this server has yet to hold', () => {
      expect(decide({ policy, scanVerdict: null, scans: false })).toBeNull();
    });
  });
});
