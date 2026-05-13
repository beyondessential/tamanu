import { describe, expect, it } from 'vitest';
import { applyChain, applyChainToBatch } from '../../src/sync/wireShims';
// Importing the registry runs registerWireShim() as a side effect, populating the
// real production registry used at runtime. The tests here exercise that exact
// registry to demonstrate cross-version sync for the notes migration end-to-end.
import '../../src/sync/wireShimsRegistry';

// versionFrom=0 is the wire shape from before migration 1759894448776
// (migrateNoteTypesToReferenceData). versionFrom=1 is the current shape.
const OLD = 0;
const NEW = 1;

describe('notes wire shim (pre/post migrateNoteTypesToReferenceData)', () => {
  describe('upcast: old facility push -> new central', () => {
    it('rewrites a built-in noteType code into the deterministic noteTypeId', () => {
      const oldFacilityRecord = {
        id: 'note-001',
        recordType: 'discharge_summary',
        date: '2025-01-15 09:30:00',
        content: 'Treatment plan summary',
        noteType: 'treatmentPlan',
      };

      const upcasted = applyChain('notes', oldFacilityRecord, OLD, NEW);

      expect(upcasted).toEqual({
        id: 'note-001',
        recordType: 'discharge_summary',
        date: '2025-01-15 09:30:00',
        content: 'Treatment plan summary',
        noteTypeId: 'notetype-treatmentPlan',
      });
      // `noteType` is gone from the canonical form.
      expect(upcasted).not.toHaveProperty('noteType');
    });

    it('maps every built-in code that the migration backfilled', () => {
      // The migration backfilled 16 codes into reference_data. The shim must cover
      // them all so an old facility can push records of any of those types.
      const allCodes = [
        'treatmentPlan',
        'discharge',
        'clinicalMobile',
        'handover',
        'areaToBeImaged',
        'resultDescription',
        'other',
        'system',
        'admission',
        'medical',
        'surgical',
        'nursing',
        'dietary',
        'pharmacy',
        'physiotherapy',
        'social',
      ];

      for (const code of allCodes) {
        const upcasted = applyChain('notes', { id: 'n', noteType: code }, OLD, NEW);
        expect(upcasted).toEqual({ id: 'n', noteTypeId: `notetype-${code}` });
      }
    });

    it('falls back to notetype-other for unknown codes', () => {
      // A facility that somehow has stored a string the migration didn't anticipate
      // (e.g. a custom NOTE_TYPES constant value from a fork or a typo) must still
      // produce a valid FK so central's NOT NULL constraint is satisfied.
      const upcasted = applyChain(
        'notes',
        { id: 'n', noteType: 'definitelyNotARealNoteType' },
        OLD,
        NEW,
      );
      expect(upcasted).toEqual({ id: 'n', noteTypeId: 'notetype-other' });
    });

    it('leaves records that already carry a noteTypeId untouched (idempotent)', () => {
      // Defensive: if somehow a record reaches the shim already in canonical shape
      // (e.g. an internal re-push), don't double-translate.
      const alreadyCanonical = { id: 'n', noteTypeId: 'notetype-discharge' };
      const upcasted = applyChain('notes', alreadyCanonical, OLD, NEW);
      expect(upcasted).toEqual({ id: 'n', noteTypeId: 'notetype-discharge' });
    });

    it('leaves records with no noteType field alone', () => {
      // E.g. a soft delete that only carries id + deletedAt
      const upcasted = applyChain('notes', { id: 'n', deletedAt: 'now' }, OLD, NEW);
      expect(upcasted).toEqual({ id: 'n', deletedAt: 'now' });
    });
  });

  describe('downcast: new central pull -> old facility', () => {
    it('rewrites a deterministic noteTypeId back into the old enum code', () => {
      const centralRecord = {
        id: 'note-001',
        recordType: 'discharge_summary',
        date: '2025-01-15 09:30:00',
        content: 'Treatment plan summary',
        noteTypeId: 'notetype-treatmentPlan',
      };

      const downcasted = applyChain('notes', centralRecord, NEW, OLD);

      expect(downcasted).toEqual({
        id: 'note-001',
        recordType: 'discharge_summary',
        date: '2025-01-15 09:30:00',
        content: 'Treatment plan summary',
        noteType: 'treatmentPlan',
      });
      expect(downcasted).not.toHaveProperty('noteTypeId');
    });

    it('falls back to other for admin-created custom note types', () => {
      // Admins can add custom rows to reference_data after the migration. Old
      // facilities can't render those types — they predate the FK column — so
      // the shim degrades to the only universally-known code.
      const downcasted = applyChain(
        'notes',
        { id: 'n', noteTypeId: 'ref/notetype/customTypeAddedLater' },
        NEW,
        OLD,
      );
      expect(downcasted).toEqual({ id: 'n', noteType: 'other' });
    });
  });

  describe('round-trip', () => {
    it('preserves built-in note types across an upcast -> downcast', () => {
      const original = { id: 'n', noteType: 'discharge' };
      const upcasted = applyChain('notes', original, OLD, NEW);
      const roundTripped = applyChain('notes', upcasted, NEW, OLD);
      expect(roundTripped).toEqual(original);
    });

    it('idempotent on the new-shape side', () => {
      const canonical = { id: 'n', noteTypeId: 'notetype-medical' };
      const downcasted = applyChain('notes', canonical, NEW, OLD);
      const reUpcasted = applyChain('notes', downcasted, OLD, NEW);
      expect(reUpcasted).toEqual(canonical);
    });
  });

  describe('applyChainToBatch (the call site in CentralSyncManager)', () => {
    it('applies the shim across a heterogeneous batch of snapshot records', () => {
      // A real sync pull batch will mix notes records with records from many other
      // models; only the notes records should be touched.
      const batch = [
        {
          recordType: 'notes',
          recordId: 'n-1',
          data: { id: 'n-1', noteTypeId: 'notetype-treatmentPlan', content: 'a' },
        },
        {
          recordType: 'encounters',
          recordId: 'e-1',
          data: { id: 'e-1', encounterType: 'admission' },
        },
        {
          recordType: 'notes',
          recordId: 'n-2',
          data: { id: 'n-2', noteTypeId: 'notetype-medical', content: 'b' },
        },
      ];

      const downcasted = applyChainToBatch(batch, NEW, OLD);

      expect(downcasted).toEqual([
        {
          recordType: 'notes',
          recordId: 'n-1',
          data: { id: 'n-1', noteType: 'treatmentPlan', content: 'a' },
        },
        {
          // unchanged — no shim registered for encounters yet
          recordType: 'encounters',
          recordId: 'e-1',
          data: { id: 'e-1', encounterType: 'admission' },
        },
        {
          recordType: 'notes',
          recordId: 'n-2',
          data: { id: 'n-2', noteType: 'medical', content: 'b' },
        },
      ]);
    });
  });
});
