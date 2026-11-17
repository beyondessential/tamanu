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
  // verifies spec: AV
  describe('off', () => {
    const policy = BLOB_SERVE_POLICIES.OFF;

    it.each([
      ['unscanned', { scanVerdict: null }],
      ['clean', { scanVerdict: BLOB_SCAN_VERDICTS.CLEAN }],
      ['infected', { scanVerdict: BLOB_SCAN_VERDICTS.INFECTED }],
    ])('serves %s content', (_label, overrides) => {
      expect(decide({ policy, ...overrides })).toBeNull();
    });

    // verifies spec: AV
    it('still withholds quarantined content', () => {
      expect(decide({ policy, quarantined: true })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });
  });

  // verifies spec: AV
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

    // verifies spec: AV
    it('withholds a hash quarantined elsewhere, unscanned here', () => {
      expect(decide({ policy, scanVerdict: null, quarantined: true, scans: false })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });
  });

  // verifies spec: AV
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

    // verifies spec: AV
    it('falls back to unless-known-bad on a server that runs no scanner', () => {
      expect(decide({ policy, scanVerdict: null, scans: false })).toBeNull();
      expect(decide({ policy, quarantined: true, scans: false })).toBe(
        BLOB_AVAILABILITY_STATES.WITHHELD_INFECTED,
      );
    });

    // verifies spec: AV
    it('does not withhold content this server has yet to hold', () => {
      expect(decide({ policy, scanVerdict: null, scans: false })).toBeNull();
    });
  });
});
