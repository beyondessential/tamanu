# D2: FHIR JSONB search operators inverted at boundaries

Investigation of item S2 from the logic bug audit (PR #10266): whether `INVERSE_OPS`
in `packages/shared/src/routes/fhir/search/where.js` maps ordering comparisons to
their complement rather than their converse.

## Verdict

**Real, not a false positive.** The four ordering entries are complements; the map
needs converses. Confirmed against the HL7 FHIR search spec and reproduced in
Postgres.

## What the code does

`singleMatch` has two paths. When the resolved path is a single column
(`entirePath.length === 1`) it emits `column OP value` and uses the operator
directly, which is correct. When the path descends into JSONB it emits the
comparison the other way round, `value OP ANY(SELECT jsonb_path_query(...))`, and
so has to flip the operator. That flip is `INVERSE_OPS`.

Flipping operands correctly means taking the **converse** (`a > b` ⟺ `b < a`).
The map's regex half does exactly that: `fhir.<~` is defined in
`000_baseline.sql` as `op_inverse_regex(regex, value) = value ~ regex`, i.e. the
same predicate with the operands swapped. The four ordering entries instead take
the **complement**:

| op | in the map | converse (correct) | complement (what's there) |
|----|-----------|--------------------|---------------------------|
| `gt`  | `lte` | `lt`  | `lte` |
| `gte` | `lt`  | `lte` | `lt`  |
| `lt`  | `gte` | `gt`  | `gte` |
| `lte` | `gt`  | `gte` | `gt`  |

With `ANY` semantics `value op' ANY(elems)` means "∃ elem: value op' elem", so the
net effect is that each ordering prefix behaves as its boundary-inclusive or
boundary-exclusive twin:

- `gt` behaves as `ge`
- `ge` behaves as `gt`
- `lt` behaves as `le`
- `le` behaves as `lt`

`eq` and `ne` are symmetric and have no entry, so they are unaffected.

## Correlation to the HL7 FHIR spec

The R5 [search page](https://hl7.org/fhir/R5/search.html) prefix table gives the
formal definitions in terms of implicit ranges:

- `gt` — "the range above the parameter value intersects (i.e. overlaps) with the range of the resource value"
- `ge` — "the range above the parameter value intersects (i.e. overlaps) with the range of the resource value, **or the range of the parameter value fully contains the range of the resource value**"
- `lt` — "the range below the parameter value intersects (i.e. overlaps) with the range of the resource value"
- `le` — "the range below the parameter value intersects (i.e. overlaps) with the range of the resource value **or the range of the parameter value fully contains the range of the resource value**"

R4 words the same six prefixes as plain comparisons ("greater than", "greater or
equal to", …) and describes the same implicit-range treatment for partial dates.
Either wording gives the same answer at the boundary: a resource value that equals
the search value must match `ge` and `le` and must **not** match `gt` or `lt`. That
is precisely the case the current mapping gets backwards.

## Reproduction

Run against a scratch Postgres, replicating the exact SQL shape `singleMatch`
emits for `Encounter?date-start=…`:

```sql
CREATE TEMP TABLE enc (id text, actual_period jsonb);
INSERT INTO enc VALUES
  ('boundary',   '{"start": "2024-01-01"}'),
  ('after',      '{"start": "2024-01-02"}'),
  ('before',     '{"start": "2023-12-31"}'),
  ('seconds',    '{"start": "2024-01-01T05:00:00+00:00"}');

-- gt2024-01-01 as emitted today (gt -> lte)
SELECT id FROM enc WHERE '2024-01-01' <= ANY(SELECT jsonb_extract_path_text(jsonb_path_query(actual_period, '$'), 'start'));
-- gt2024-01-01 with the converse (gt -> lt)
SELECT id FROM enc WHERE '2024-01-01' <  ANY(SELECT jsonb_extract_path_text(jsonb_path_query(actual_period, '$'), 'start'));
```

Result: the current form returns `boundary, after, seconds`; the converse returns
`after, seconds`. Symmetrically, `le2024-01-01` returns only `before` today, where
the converse returns `boundary, before`. The two forms differ on exactly one row —
the one whose stored value equals the search value — which is the whole of the bug
and also the whole of why it is currently invisible.

## Why it is currently masked

The JSONB comparison path is only reachable for a `date` or `number` search
parameter whose path has more than one segment. Every such parameter in the
codebase today is one of two:

- `Encounter.date-start` → `actualPeriod.start`
- `Encounter.end-date` → `actualPeriod.end`

Both declare `datePrecision: DAYS`, so `typedMatch` truncates the search value to
`yyyy-MM-dd`. The stored values come from `formatFhirDate` in
`Encounter/getValues.ts` and always carry full second precision with an offset
(`2024-01-01T05:00:00+00:00`). A truncated day string can therefore never be
string-equal to a stored value, the boundary row never exists, and `>=` and `>`
select identically.

Every other `date` parameter (`Patient.birthdate`, `MedicationRequest.authoredOn`,
`ServiceRequest.occurrenceDateTime`) resolves to a single column and takes the
correct fast path. There are no `number` parameters at all. So the bug is latent,
and lands the moment someone adds a JSONB-pathed `number` parameter, or a JSONB-pathed
`date` parameter whose declared precision matches the precision of the stored value.

There is no test coverage: nothing in the repo exercises `generateWhereClause` or
`singleMatch`, and no test hits `date-start` or `end-date`.

## Fix

- [x] Change the four ordering entries in `INVERSE_OPS` to converses: `gt`→`lt`, `gte`→`lte`, `lt`→`gt`, `lte`→`gte`
- [x] Rename the map to `CONVERSE_OPS`. "Inverse" reads as negation, which is exactly the mistake the map makes; the surrounding comment already said the intent is direction reversal, not negation
- [x] Add unit coverage over `singleMatch` for the JSONB path — both regex and ordering ops — asserting the emitted comparison rather than only end-to-end search results, since end-to-end results cannot distinguish the two mappings. Verified by reintroducing the old mapping: the four ordering tests fail, the rest pass
- [x] Add integration coverage for `Encounter?date-start=` and `?end-date=`, which had none

Integration coverage stops short of all six prefixes. `gt` and `le` cannot be asserted
on a day an encounter falls on without pinning the range-semantics defect in place, so
those boundary cases are left to Q3 and recorded as owed coverage in the card's test
cases. `gt` is covered against a non-encounter day instead.

The fix is behaviour-preserving against all live search parameters, so it needs no
spec change and carries no migration.

Running the central-server suite on this machine needs `DATABASE_URL` unset — when it is
set, `resolveDbConfig` lets it override the test config's connection target.

## Adjacent findings (out of scope for this card)

Two further defects sit in the same code and are worth raising separately rather
than folding in here:

**Date precision is compared as a point, not a range.** `typedMatch` truncates a
`DAYS`-precision search value to `yyyy-MM-dd` and string-compares it against a
second-precision stored value. Per the spec's implicit-range rules,
`Encounter?date-start=le2024-01-01` must match an encounter starting at
`2024-01-01T05:00:00+00:00` (the search range fully contains the resource value),
and `gt2024-01-01` must not. Today the first misses and the second matches — both
wrong, and both wrong under the converse fix too, because the defect is in how the
search value is reduced rather than in the operator. Fixing it means expanding a
partial date into `[start, end)` bounds and emitting a range comparison. This is the
larger of the two problems and is the one users can actually hit today.

**`PRESENCE` tokens would emit invalid SQL on a JSONB path.** `typedMatch` returns
`Op.is`/`Op.not` against `null`, which on the JSONB branch renders as
`NULL IS ANY(…)`. The only `PRESENCE` parameter today is `Patient.deceased`, which
is single-segment, so this is unreachable — but it is a second latent trap in the
same `singleMatch` branch.
