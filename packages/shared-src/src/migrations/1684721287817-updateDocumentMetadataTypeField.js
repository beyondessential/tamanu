import { QueryTypes } from 'sequelize';

const TYPE_MAPPING = {
  'application/pdf': 'RAW_PDF',
  'image/jpeg': 'RAW_JPEG',
  'patient_letter': 'PATIENT_LETTER',
};

export async function up(query) {
  const unknownDocumentTypes = await query.sequelize.query(
    `
      SELECT COUNT(*), type 
      FROM document_metadata
      WHERE type NOT IN (:known_types)
      GROUP BY type
    `,
    {
      replacements: {
        known_types: Object.keys(TYPE_MAPPING),
      },
      type: QueryTypes.SELECT,
    },
  );

  if (unknownDocumentTypes.length > 0) {
    const typesWithCount = unknownDocumentTypes.map(d => `"${d.type}" (x${d.count})`).join(',');
    throw new Error(
      `Found some unknown document_metadata types. Please resolve before proceeding.\nThe types are: ${typesWithCount}`,
    );
  }
  await Promise.all(Object.entries(TYPE_MAPPING).map(([from, to]) =>
    query.sequelize.query(`
      UPDATE document_metadata dm
      SET type = '${to}'
      where type = '${from}';
    `)
  ));
}

export async function down(query) {
  const unknownDocumentTypes = await query.sequelize.query(
    `
      SELECT COUNT(*), type 
      FROM document_metadata
      WHERE type NOT IN (:known_types)
      GROUP BY type
    `,
    {
      replacements: {
        known_types: Object.values(TYPE_MAPPING),
      },
      type: QueryTypes.SELECT,
    },
  );

  if (unknownDocumentTypes.length > 0) {
    const typesWithCount = unknownDocumentTypes.map(d => `"${d.type}" (x${d.count})`).join(',');
    throw new Error(
      `Found some unknown document_metadata types. Please resolve before proceeding.\nThe types are: ${typesWithCount}`,
    );
  }
  await Promise.all(Object.entries(TYPE_MAPPING).map(([to, from]) =>
    query.sequelize.query(`
      UPDATE document_metadata dm
      SET type = '${to}'
      where type = '${from}';
    `)
  ));
}
