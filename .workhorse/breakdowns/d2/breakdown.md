# FHIR JSONB search defects

Two further defects found in `singleMatch` in `packages/shared/src/routes/fhir/search/where.js` while investigating the operator inversion. Both sit in the same JSONB comparison branch but are independent of it, and neither is fixed by the converse correction this card covers.

## Compare FHIR date search values as ranges, not points · Q3

A partial-precision date search value carries an implicit range under the HL7 FHIR search spec, but `typedMatch` reduces a `DAYS`-precision value to a `yyyy-MM-dd` string and string-compares it against a stored value held at full second precision. So `Encounter?date-start=le2024-01-01` misses an encounter starting `2024-01-01T05:00:00+00:00` even though the search range fully contains it, and `gt2024-01-01` matches it even though it must not. Both prefixes give the wrong answer today and stay wrong after the operator inversion is corrected, because the defect is in how the search value is reduced rather than in which operator is emitted.

The work is to expand a partial date into `[start, end)` bounds according to its declared precision and emit a range comparison for each of the six prefixes, matching the formal range definitions in the spec's prefix table. This is the larger of the two and the only one users can hit on current data.

## Emit valid SQL for FHIR presence tokens on nested paths · R3

A `PRESENCE` token search returns `Op.is`/`Op.not` against `null`, which the single-column branch of `singleMatch` renders correctly but the JSONB branch renders as `NULL IS ANY(…)` — not valid SQL. The only presence parameter defined today is `Patient.deceased`, whose path is a single column, so nothing reaches the broken branch; it fails the moment a presence parameter is declared against a nested path.

The work is to give presence tokens a correct JSONB form (testing whether the path yields a value at all, rather than flipping a null comparison) and cover it with a test, so the trap is gone before someone adds such a parameter.
