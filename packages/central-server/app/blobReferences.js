// spec: BLAC
// Scoping mirrors the pull filter over sync_lookup, so a source must be a synced table or its
// references authorise nothing.
const BLOB_REFERENCE_SOURCES = [{ recordType: 'attachments', hashColumn: 'hash' }];

// Identifiers are interpolated into SQL, since they can't be parameterised.
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

export function registerBlobReferenceSource({ recordType, hashColumn }) {
  if (!SAFE_IDENTIFIER.test(recordType) || !SAFE_IDENTIFIER.test(hashColumn)) {
    throw new Error(
      `Blob reference source must use plain snake_case identifiers: ${recordType}.${hashColumn}`,
    );
  }
  // Idempotent: a process may build its context more than once, notably across test contexts.
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

// spec: SCRUB
// Push is sync-first, so every reference is briefly ahead of its bytes: `deliveredBefore` separates
// a fault from content-pending.
export async function findUndeliverableReferences(sequelize, { limit, deliveredBefore }) {
  if (BLOB_REFERENCE_SOURCES.length === 0) {
    return [];
  }

  const replacements = { limit, deliveredBefore };
  const perSource = BLOB_REFERENCE_SOURCES.map(({ recordType, hashColumn }, index) => {
    replacements[`recordType${index}`] = recordType;
    // Both sides are checked: the lookup keeps `data` for a deleted row, and a source may be
    // tombstoned ahead of its lookup entry.
    return `
      SELECT record.${hashColumn} AS hash, record.updated_at AS referenced_at
      FROM ${recordType} record
      JOIN sync_lookup
        ON sync_lookup.record_type = :recordType${index}
        AND sync_lookup.record_id = record.id::text
      WHERE record.${hashColumn} IS NOT NULL
      AND record.deleted_at IS NULL
      AND sync_lookup.is_deleted IS NOT TRUE
      AND sync_lookup.data IS NOT NULL
      AND record.updated_at < :deliveredBefore`;
  });

  // Longest-undelivered first, so a backlog past the limit reports the same worst cases every pass.
  const [rows] = await sequelize.query(
    `
      SELECT referenced.hash
      FROM (${perSource.join(' UNION ALL ')}) referenced
      LEFT JOIN blobs ON blobs.hash = referenced.hash AND blobs.deleted_at IS NULL
      WHERE blobs.id IS NULL
      GROUP BY referenced.hash
      ORDER BY MIN(referenced.referenced_at)
      LIMIT :limit
    `,
    { replacements },
  );
  return rows.map(({ hash }) => hash);
}

// spec: BLAC
// `facilityIds` is the declared, validated scope, never the user's whole entitlement.
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
