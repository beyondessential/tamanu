import { expect, it } from 'vitest';
import { START, END, MigrationStr } from '../src/step.js';
import { MIGRATIONS_END, MIGRATIONS_START, orderSteps } from '../src/listSteps.js';

const PENDING_MIGRATIONS: MigrationStr[] = [
  'migration/1744261686398-addEnabledCheckToAuditTrigger',
  'migration/1744602896344-addLookupTicksTable',
  'migration/1745987213057-OptimiseFhirJobGrabFunction',
  'migration/1747862710346-removeColumnsFromChangelogs',
  'migration/1748216223615-separateSyncSessionParametersFromDebugInfo',
  'migration/1748555633925-fullyResyncPatientProgramRegistrations',
];

it('simple', async () => {
  const { order } = await orderSteps(
    [
      {
        id: 'upgrade/foo/0',
        file: 'upgrade/foo',
        step: {
          at: START,
          before: [],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
      {
        id: 'upgrade/bar/0',
        file: 'upgrade/bar',
        step: {
          at: END,
          before: [],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
    ],
    [],
  );
  expect(order).toEqual([
    START,
    'upgrade/foo/0',
    MIGRATIONS_START,
    MIGRATIONS_END,
    'upgrade/bar/0',
    END,
  ]);
});

it('multi step file with indexed step dep', async () => {
  const { order } = await orderSteps(
    [
      {
        id: 'upgrade/foo/0',
        file: 'upgrade/foo',
        step: {
          at: START,
          before: [],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
      {
        id: 'upgrade/foo/1',
        file: 'upgrade/foo',
        step: {
          at: START,
          before: [],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
      {
        id: 'upgrade/bar/0',
        file: 'upgrade/bar',
        step: {
          at: END,
          before: ['upgrade/foo/1'],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
    ],
    [],
  );
  expect(order).toEqual([
    START,
    'upgrade/foo/0',
    'upgrade/bar/0',
    'upgrade/foo/1',
    MIGRATIONS_START,
    MIGRATIONS_END,
    END,
  ]);
});

it('migration dependency', async () => {
  const { order } = await orderSteps(
    [
      {
        id: 'upgrade/foo/0',
        file: 'upgrade/foo',
        step: {
          at: START,
          before: ['migration/1748216223615-separateSyncSessionParametersFromDebugInfo'],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
      {
        id: 'upgrade/bar/0',
        file: 'upgrade/bar',
        step: {
          at: END,
          before: [],
          after: [],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
      {
        id: 'upgrade/baz/0',
        file: 'upgrade/baz',
        step: {
          at: END,
          before: ['migration/1747862710346-removeColumnsFromChangelogs'],
          after: ['migration/1744602896344-addLookupTicksTable'],
          check: () => Promise.resolve(true),
          run: () => Promise.resolve(),
        },
      },
    ],
    PENDING_MIGRATIONS,
  );
  expect(order).toEqual([
    START,
    'upgrade/foo/0',
    MIGRATIONS_START,
    'migration/1744261686398-addEnabledCheckToAuditTrigger',
    'migration/1744602896344-addLookupTicksTable',
    'migration/1745987213057-OptimiseFhirJobGrabFunction',
    'upgrade/baz/0',
    'migration/1747862710346-removeColumnsFromChangelogs',
    'migration/1748216223615-separateSyncSessionParametersFromDebugInfo',
    'migration/1748555633925-fullyResyncPatientProgramRegistrations',
    MIGRATIONS_END,
    'upgrade/bar/0',
    END,
  ]);
});
