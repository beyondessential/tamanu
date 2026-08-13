# D2 test cases

Coverage for the converse-operator fix in the FHIR search where-clause builder.

## Operator mapping

- [x] Each ordering prefix (`gt`, `ge`, `lt`, `le`) on a JSONB path emits its converse, not its complement
- [x] A symmetric comparison (`eq`) is emitted unchanged
- [x] A single-column path emits the operator directly, with no flip
- [x] A case-insensitive string match on a JSONB path emits the custom `fhir.<~*` converse operator
- [x] An exact string match on a JSONB path is emitted unchanged
- [x] The GIN pre-scan condition is emitted alongside the comparison

## Encounter period search

- [x] `date-start=gt` finds only encounters starting after the given day
- [x] `date-start=lt` finds only encounters starting before the given day
- [x] `date-start=ge` includes an encounter starting on the given day
- [x] `end-date=gt` finds only encounters ending after the given day
- [x] `end-date=lt` finds only encounters ending before the given day

Owed coverage, blocked on the range-semantics defect on card Q3. Asserting these today
would either fail or pin the wrong behaviour in place, so they stay unticked until Q3
lands rather than being written against current behaviour.

- [ ] `date-start=gt` excludes an encounter starting on the given day
- [ ] `date-start=le` includes an encounter starting on the given day
- [ ] `end-date=gt` excludes an encounter ending on the given day
- [ ] `end-date=le` includes an encounter ending on the given day
- [ ] `date-start=eq` matches an encounter starting anywhere within the given day
- [ ] `date-start=ne` excludes an encounter starting anywhere within the given day
