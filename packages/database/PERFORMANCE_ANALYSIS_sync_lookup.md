# Performance Analysis: sync_lookup Table Migrations

## Problem Summary

Several migrations took ~3.5 hours to run on Aspen due to performance issues with the `sync_lookup` table (~58M rows). The main issue is that queries filtering by `record_type` are extremely slow because there's **no index on `record_type`**.

## Current Indexes

Based on migration files:
1. **Primary Key**: `id` (bigint, auto-increment)
2. **Unique Constraint/Index**: `(record_id, record_type)` - **Note**: This is a composite index with `record_id` first
3. **Composite Index**: `(updated_at_sync_tick, record_id, patient_id, facility_id)`
4. **Index**: `patient_id`

### Why the `(record_id, record_type)` index doesn't help

The existing unique constraint creates an index on `(record_id, record_type)`. However, **PostgreSQL can only efficiently use a composite index when querying by the leftmost columns** (the "leftmost prefix rule").

This means:
- ✅ `WHERE record_id = '...'` - **CAN use the index** (leftmost column)
- ✅ `WHERE record_id = '...' AND record_type = '...'` - **CAN use the index** (both columns)
- ❌ `WHERE record_type = '...'` - **CANNOT efficiently use the index** (not the leftmost column)

When you query by `record_type` alone, PostgreSQL would need to scan the entire index, which is essentially a full table scan. This is why the migrations are slow.

## Problematic Migrations

### 1. `1748555633925-fullyResyncPatientProgramRegistrations.ts`
```sql
DELETE FROM sync_lookup
WHERE record_type IN ('patient_program_registrations', 'patient_program_registration_conditions')
```
**Issue**: No index on `record_type`, causing full table scan on 58M rows.

### 2. `1754351568045-fullyResyncPatientProgramRegistrationsAndConditions.ts`
Same DELETE query as above.

### 3. `1755237235317-RebuildLookupTableForPrescriptionsChanges.ts`
```sql
DELETE FROM sync_lookup
WHERE record_type = 'encounter_medications'
```
**Issue**: Same - no index on `record_type`.

### 4. `1750719607520-backfillInitialSyncLookupTick.ts`
```sql
SELECT MAX(updated_at_sync_tick) FROM sync_lookup 
WHERE updated_at_sync_tick < (SELECT MIN(lookup_end_tick) FROM sync_lookup_ticks)
```
**Issue**: While `updated_at_sync_tick` is in a composite index, the WHERE clause might not be optimally using it. Also does `SELECT MAX(updated_at_sync_tick) FROM sync_lookup` which scans the entire table.

## Root Cause

**Missing index on `record_type`**: All DELETE operations filtering by `record_type` require a full table scan, which on a 58M row table is extremely slow.

## Recommended Solutions

### 1. Add Index on `record_type` (CRITICAL)

This is the most important fix. Add a B-tree index on `record_type`:

```sql
CREATE INDEX sync_lookup_record_type ON sync_lookup (record_type);
```

**Impact**: Will make all `WHERE record_type = ...` and `WHERE record_type IN (...)` queries use an index instead of full table scans.

**Trade-offs**:
- Index creation will take time on 58M rows (but can be done with `CONCURRENTLY` to avoid locking)
- Additional storage space (~1-2% of table size)
- Slight overhead on INSERT/UPDATE operations (minimal)

### 2. Consider Composite Index for Common Query Patterns

If queries often filter by both `record_type` and `updated_at_sync_tick`, consider:
```sql
CREATE INDEX sync_lookup_record_type_tick ON sync_lookup (record_type, updated_at_sync_tick);
```

This could help queries like:
```sql
SELECT * FROM sync_lookup 
WHERE record_type = 'encounter_prescriptions' 
AND updated_at_sync_tick > :since
```

### 3. Optimize Large DELETE Operations

For future migrations that delete large numbers of rows:

**Option A: Batch DELETE operations**
```sql
-- Delete in chunks to avoid long-running transactions
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  LOOP
    DELETE FROM sync_lookup
    WHERE record_type = 'encounter_medications'
    AND id IN (
      SELECT id FROM sync_lookup
      WHERE record_type = 'encounter_medications'
      LIMIT 10000
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    EXIT WHEN deleted_count = 0;
    COMMIT;
  END LOOP;
END $$;
```

**Option B: Use WHERE id IN (SELECT ...) pattern**
```sql
DELETE FROM sync_lookup
WHERE id IN (
  SELECT id FROM sync_lookup
  WHERE record_type = 'encounter_medications'
  LIMIT 100000
);
```

### 4. Add Index on `updated_at_sync_tick` (if not already optimal)

The composite index `(updated_at_sync_tick, record_id, patient_id, facility_id)` should help with queries filtering by `updated_at_sync_tick`, but if queries only filter by `updated_at_sync_tick`, a single-column index might be more efficient:

```sql
CREATE INDEX sync_lookup_updated_at_sync_tick ON sync_lookup (updated_at_sync_tick);
```

### 5. Monitor Query Performance

After adding indexes, use `EXPLAIN ANALYZE` to verify queries are using indexes:

```sql
EXPLAIN ANALYZE
SELECT count(*) FROM sync_lookup WHERE record_type = 'encounter_prescriptions';
```

**Before adding the index**, you'll likely see:
- `Seq Scan on sync_lookup` - Full table scan (slow)
- Or `Index Scan using sync_lookup_record_id_record_type_key` but scanning the entire index (also slow)

**After adding the index**, you should see:
- `Index Scan using sync_lookup_record_type` - Efficient index scan (fast)

You can verify the current behavior by running:
```sql
EXPLAIN ANALYZE
SELECT count(*) FROM sync_lookup WHERE record_type = 'encounter_prescriptions';
```

If it shows a `Seq Scan` or scans the entire `(record_id, record_type)` index, that confirms the need for a dedicated `record_type` index.

## Implementation Priority

1. **HIGH**: Add index on `record_type` - this will fix the immediate problem
2. **MEDIUM**: Optimize future DELETE operations to use batching
3. **LOW**: Consider additional composite indexes based on actual query patterns

## Migration Strategy

When creating the index migration:

1. **Use CONCURRENTLY** to avoid locking the table during index creation:
   ```sql
   CREATE INDEX CONCURRENTLY sync_lookup_record_type ON sync_lookup (record_type);
   ```
   Note: This requires PostgreSQL 9.2+ and cannot be run inside a transaction.

2. **Monitor index creation progress** (on PostgreSQL 12+):
   ```sql
   SELECT * FROM pg_stat_progress_create_index;
   ```

3. **Estimate index size** before creation:
   ```sql
   SELECT pg_size_pretty(pg_relation_size('sync_lookup'));
   -- Index will be roughly 1-2% of table size
   ```

## Additional Considerations

- **Vacuum/ANALYZE**: After large DELETE operations, run `VACUUM ANALYZE sync_lookup;` to update statistics
- **Partitioning**: For very large tables, consider partitioning by `record_type` in the future
- **Archiving**: Consider archiving old records if they're not actively used
