# Understanding Database Indexes

## What is an Index?

An **index** is a data structure that helps the database find rows quickly without scanning the entire table. Think of it like an index in a book - instead of reading every page to find a topic, you look it up in the index and jump directly to the right page.

## Real-World Analogy

Imagine you have a phone book with 58 million entries (like your `sync_lookup` table):

**Without an index:**
- To find "John Smith", you start at page 1 and read through every single entry
- This takes a very long time (hours for 58M rows)

**With an index (sorted by last name):**
- The index tells you "Smith" entries start around page 2,847,392
- You jump directly there and find "John Smith" quickly
- This takes seconds

## How Indexes Work

### 1. Basic Structure

An index is essentially a **sorted copy** of the column(s) you're indexing, along with pointers to the actual rows:

```
Table: sync_lookup
┌────┬──────────────┬─────────────────────┬─────┐
│ id │ record_type  │ record_id           │ ... │
├────┼──────────────┼─────────────────────┼─────┤
│ 1  │ prescriptions│ abc123              │ ... │
│ 2  │ encounters   │ def456              │ ... │
│ 3  │ prescriptions│ ghi789              │ ... │
│ 4  │ patients     │ jkl012              │ ... │
│ 5  │ prescriptions│ mno345              │ ... │
└────┴──────────────┴─────────────────────┴─────┘

Index on record_type:
┌─────────────────────┬─────┐
│ record_type         │ id  │
├─────────────────────┼─────┤
│ encounters          │ 2   │
│ patients            │ 4   │
│ prescriptions       │ 1   │
│ prescriptions       │ 3   │
│ prescriptions       │ 5   │
└─────────────────────┴─────┘
(sorted alphabetically)
```

### 2. B-Tree Index (Most Common Type)

PostgreSQL uses **B-Tree indexes** (balanced tree). Here's how they work:

```
                    [encounters, patients]
                          /        \
              [encounters]          [patients, prescriptions]
                /                          \
        [encounters]              [patients]  [prescriptions]
```

- The tree is **balanced** - all paths from root to leaf are the same length
- Searching is **logarithmic** - O(log n) instead of O(n)
- For 58M rows: ~26 comparisons instead of 58 million!

### 3. How a Query Uses an Index

When you run:
```sql
SELECT * FROM sync_lookup WHERE record_type = 'prescriptions';
```

**Without index:**
1. Start at row 1
2. Check if `record_type = 'prescriptions'`
3. Move to row 2, check again
4. Repeat for all 58M rows
5. **Time: O(n)** - linear with table size

**With index:**
1. Look up 'prescriptions' in the index tree
2. Find all matching row IDs (1, 3, 5, ...)
3. Jump directly to those rows
4. **Time: O(log n)** - logarithmic with table size

## Types of Indexes

### 1. Single-Column Index
```sql
CREATE INDEX idx_record_type ON sync_lookup (record_type);
```
- Fast for: `WHERE record_type = '...'`
- Not useful for: `WHERE record_id = '...'` (different column)

### 2. Composite Index (Multiple Columns)
```sql
CREATE INDEX idx_composite ON sync_lookup (record_id, record_type);
```
- Fast for: `WHERE record_id = '...'` ✅
- Fast for: `WHERE record_id = '...' AND record_type = '...'` ✅
- **NOT fast for**: `WHERE record_type = '...'` ❌ (leftmost prefix rule)

**Leftmost Prefix Rule:**
- A composite index `(A, B, C)` can be used for queries on:
  - `A` alone ✅
  - `A, B` ✅
  - `A, B, C` ✅
  - But NOT `B` alone ❌ or `C` alone ❌

This is why your `(record_id, record_type)` index doesn't help with `WHERE record_type = '...'` queries!

### 3. Unique Index
```sql
CREATE UNIQUE INDEX idx_unique ON sync_lookup (record_id, record_type);
```
- Same as regular index, but also enforces uniqueness
- Prevents duplicate combinations

## Performance Impact

### Query Speed

| Operation | Without Index | With Index | Improvement |
|-----------|---------------|------------|-------------|
| Find 1 row | Scan 58M rows | ~26 comparisons | ~2,000,000x faster |
| Find 1M rows | Scan 58M rows | Index scan + 1M lookups | ~58x faster |
| Count rows | Scan all 58M | Index scan | ~1000x faster |

### Your Specific Case

**Before index on `record_type`:**
```sql
SELECT count(*) FROM sync_lookup WHERE record_type = 'encounter_prescriptions';
-- Execution: Seq Scan on sync_lookup (cost=0.00..1234567.89 rows=...)
-- Time: Hours (scanning 58M rows)
```

**After index on `record_type`:**
```sql
SELECT count(*) FROM sync_lookup WHERE record_type = 'encounter_prescriptions';
-- Execution: Index Scan using sync_lookup_record_type (cost=0.43..1234.56 rows=...)
-- Time: Seconds (using index)
```

## Trade-offs

### Benefits ✅
- **Much faster reads** - Queries can be 100-1000x faster
- **Efficient lookups** - Logarithmic instead of linear time
- **Better for large tables** - Performance doesn't degrade linearly

### Costs ❌
- **Storage space** - Indexes take up disk space (typically 10-20% of table size)
- **Slower writes** - INSERT/UPDATE/DELETE must also update the index
- **Maintenance** - Indexes need to be maintained as data changes

### When to Use Indexes

**Use indexes when:**
- ✅ Column is frequently used in WHERE clauses
- ✅ Table is large (>100K rows)
- ✅ Queries are slow
- ✅ Column has good selectivity (many distinct values)

**Don't over-index:**
- ❌ Small tables (<10K rows) - full scan is fast enough
- ❌ Columns rarely queried
- ❌ Columns with very few distinct values (like boolean flags)
- ❌ Tables with very high write volume and few reads

## How PostgreSQL Chooses Indexes

When you run a query, PostgreSQL's query planner:

1. **Analyzes the query** - What columns are filtered?
2. **Checks available indexes** - What indexes exist?
3. **Estimates costs** - Index scan vs. sequential scan
4. **Chooses the best plan** - Usually the lowest cost

You can see this with `EXPLAIN`:
```sql
EXPLAIN SELECT * FROM sync_lookup WHERE record_type = 'prescriptions';

-- Shows:
-- Seq Scan (if no index) - expensive
-- Index Scan (if index exists) - cheap
```

## Your sync_lookup Table Situation

### Current State
- ✅ Index on `(record_id, record_type)` - helps with `WHERE record_id = '...'`
- ✅ Index on `patient_id` - helps with `WHERE patient_id = '...'`
- ❌ **No index on `record_type` alone** - causes full scans

### The Problem
```sql
DELETE FROM sync_lookup WHERE record_type = 'encounter_medications';
```

PostgreSQL can't use the `(record_id, record_type)` index because:
- The index starts with `record_id`, not `record_type`
- Leftmost prefix rule means it can't skip to `record_type`
- Falls back to sequential scan of 58M rows → Hours!

### The Solution
```sql
CREATE INDEX sync_lookup_record_type ON sync_lookup (record_type);
```

Now:
- `WHERE record_type = '...'` uses the index ✅
- Queries complete in seconds instead of hours ✅
- DELETE operations are fast ✅

## Summary

**Indexes are:**
- Sorted data structures that point to table rows
- Like a book index - jump directly to what you need
- Make queries 100-1000x faster on large tables

**How they work:**
- B-Tree structure allows logarithmic search time
- O(log n) instead of O(n) - huge difference on large tables
- Composite indexes follow "leftmost prefix" rule

**For your case:**
- You need a dedicated index on `record_type`
- The existing `(record_id, record_type)` index can't help
- Adding the index will make your migrations fast
