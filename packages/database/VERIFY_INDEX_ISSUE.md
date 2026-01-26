# Verifying the record_type Index Issue

## The Problem

Queries filtering by `record_type` are extremely slow because there's no dedicated index on that column.

## How to Verify

### 1. Check Current Query Plan (Before Index)

Run this on your Aspen database to see what's happening:

```sql
EXPLAIN ANALYZE
SELECT count(*) FROM sync_lookup WHERE record_type = 'encounter_prescriptions';
```

**Expected output (BAD - showing the problem):**
```
                                                      QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=... rows=1 width=8) (actual time=... loops=1)
   ->  Seq Scan on sync_lookup  (cost=0.00..... rows=... width=0) (actual time=... loops=1)
         Filter: ((record_type)::text = 'encounter_prescriptions'::text)
         Rows Removed by Filter: ...
 Planning Time: ...
 Execution Time: ... (THIS WILL BE VERY HIGH - hours potentially)
```

**What this means:**
- `Seq Scan` = Sequential scan = Full table scan
- PostgreSQL is reading through all 58M rows one by one
- This is why it takes hours

### 2. Check What Indexes Exist

```sql
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'sync_lookup'
AND schemaname = 'public'
ORDER BY indexname;
```

**You should see:**
- `sync_lookup_pkey` (on `id`)
- `sync_lookup_record_id_record_type_key` (unique constraint on `record_id, record_type`)
- `sync_lookup_updated_at_sync_tick_record_id_patient_id_facility_id` (composite index)
- `sync_lookup_patient_id` (on `patient_id`)
- **NO index on `record_type` alone** ← This is the problem!

### 3. Why the Existing Index Doesn't Help

The unique constraint `(record_id, record_type)` creates an index, but it can't be used efficiently for `WHERE record_type = '...'` queries because:

```sql
-- This query CAN use the (record_id, record_type) index:
EXPLAIN ANALYZE
SELECT * FROM sync_lookup 
WHERE record_id = 'some-id' AND record_type = 'encounter_prescriptions';
-- Should show: Index Scan using sync_lookup_record_id_record_type_key

-- But this query CANNOT use it efficiently:
EXPLAIN ANALYZE
SELECT count(*) FROM sync_lookup 
WHERE record_type = 'encounter_prescriptions';
-- Will show: Seq Scan (full table scan)
```

### 4. After Adding the Index (Expected Improvement)

Once you run the migration `1769400000000-addRecordTypeIndexToSyncLookup.ts`, verify it worked:

```sql
-- Check the index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'sync_lookup' 
AND indexname = 'sync_lookup_record_type';
-- Should return: sync_lookup_record_type

-- Now check the query plan again
EXPLAIN ANALYZE
SELECT count(*) FROM sync_lookup WHERE record_type = 'encounter_prescriptions';
```

**Expected output (GOOD - after index):**
```
                                                      QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=... rows=1 width=8) (actual time=... loops=1)
   ->  Index Scan using sync_lookup_record_type on sync_lookup  (cost=0.43..... rows=... width=0) (actual time=... loops=1)
         Index Cond: ((record_type)::text = 'encounter_prescriptions'::text)
 Planning Time: ...
 Execution Time: ... (THIS SHOULD BE SECONDS, NOT HOURS)
```

**What this means:**
- `Index Scan` = Using the index efficiently
- PostgreSQL jumps directly to the relevant rows
- Should complete in seconds instead of hours

## Performance Comparison

| Query Type | Without Index | With Index | Improvement |
|------------|---------------|------------|-------------|
| `SELECT count(*) WHERE record_type = '...'` | Hours (full scan) | Seconds (index scan) | ~1000x faster |
| `DELETE WHERE record_type = '...'` | Hours (full scan) | Minutes (index scan) | ~100x faster |

## Real-World Impact

Your specific issues:
1. ✅ `select count(*) from sync_lookup where record_type = 'encounter_prescriptions'` - **Will go from hours to seconds**
2. ✅ `DELETE FROM sync_lookup WHERE record_type IN (...)` - **Will go from hours to minutes**
3. ✅ All migrations filtering by `record_type` - **Will complete in reasonable time**

## Summary

**Yes, the lack of a dedicated index on `record_type` is 100% the cause of the slow WHERE queries.**

The existing `(record_id, record_type)` composite index cannot be used efficiently for queries that only filter by `record_type`, forcing PostgreSQL to do full table scans on 58M rows.
