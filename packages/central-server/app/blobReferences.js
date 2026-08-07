// spec: BLAC
// The tables that reference blobs by hash. Access to blob content is authorised
// against these references: a hash is in scope for a requesting server when at
// least one referencing record lies within that server's synchronisation scope,
// mirroring the pull filter over sync_lookup (see snapshotOutgoingChanges), so
// blob scoping cannot drift from record scoping. A source registered here must
// be a synced table (present in sync_lookup), or its references never authorise
// anything.
//
// Empty until the consumer tables carry hash columns: attachments and assets
// add themselves as they move onto the blob store.
const BLOB_REFERENCE_SOURCES = [];

// Table and column names are interpolated into SQL as identifiers (which can't
// be parameterised); anything else goes through replacements. The pattern
// admits digits after the first character so names like `document_metadata_v2`
// register.
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

export function registerBlobReferenceSource({ recordType, hashColumn }) {
  if (!SAFE_IDENTIFIER.test(recordType) || !SAFE_IDENTIFIER.test(hashColumn)) {
    throw new Error(
      `Blob reference source must use plain snake_case identifiers: ${recordType}.${hashColumn}`,
    );
  }
  // Idempotent: a server process may build its context more than once (notably
  // across test contexts), and the same source must not stack duplicate UNION
  // branches into the scope query.
  const existing = BLOB_REFERENCE_SOURCES.find(
    s => s.recordType === recordType && s.hashColumn === hashColumn,
  );
  if (existing) {
    return () => {
      const index = BLOB_REFERENCE_SOURCES.indexOf(existing);
      if (index !== -1) {
        BLOB_REFERENCE_SOURCES.splice(index, 1);
      }
    };
  }
  const source = { recordType, hashColumn };
  BLOB_REFERENCE_SOURCES.push(source);
  return () => {
    const index = BLOB_REFERENCE_SOURCES.indexOf(source);
    if (index !== -1) {
      BLOB_REFERENCE_SOURCES.splice(index, 1);
    }
  };
}

// spec: BLAC
// Whether a hash is referenced by a record within the given facility scope.
// `facilityIds` is the set of facilities the requesting server operates as —
// the same set record synchronisation scopes a pull to, declared by the client
// and validated against its entitlement by the caller, never the user's whole
// entitlement (which may be every facility). The scope predicate is the sync
// pull filter's: a record is in scope when its patient is marked for sync at one
// of the facilities and, for records pinned to a (sensitive) facility, that
// facility is among them.
export async function isHashReferencedInScope(sequelize, { hash, facilityIds }) {
  if (BLOB_REFERENCE_SOURCES.length === 0 || facilityIds.length === 0) {
    return false;
  }

  const scopeClause = `
      AND (
        sync_lookup.patient_id IS NULL
        OR sync_lookup.patient_id IN (
          SELECT patient_id FROM patient_facilities WHERE facility_id IN (:facilityIds)
        )
      )
      AND (
        sync_lookup.facility_id IS NULL
        OR sync_lookup.facility_id IN (:facilityIds)
      )`;
  // Table and column names must be interpolated (SQL identifiers can't be
  // bound), and are constrained to SAFE_IDENTIFIER at registration. The
  // record_type value is a bound parameter per source.
  const replacements = { hash, facilityIds };
  const perSource = BLOB_REFERENCE_SOURCES.map(({ recordType, hashColumn }, index) => {
    replacements[`recordType${index}`] = recordType;
    return `
      SELECT 1
      FROM ${recordType} record
      JOIN sync_lookup
        ON sync_lookup.record_type = :recordType${index}
        AND sync_lookup.record_id = record.id::text
      WHERE record.${hashColumn} = :hash
      AND sync_lookup.data IS NOT NULL
      ${scopeClause}`;
  });

  const [[{ referenced }]] = await sequelize.query(
    `SELECT EXISTS (${perSource.join(' UNION ALL ')}) AS "referenced"`,
    { replacements },
  );
  return referenced;
}
