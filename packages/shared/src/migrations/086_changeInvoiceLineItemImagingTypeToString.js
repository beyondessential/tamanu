const INVOICE_LINE_TYPES_TABLE_NAME = 'invoice_line_types';
const INVOICE_LINE_ITEMS_TABLE_NAME = 'invoice_line_items';

export const IMAGING_TYPES = {
  X_RAY: 'xRay',
  CT_SCAN: 'ctScan',
  ULTRASOUND: 'ultrasound',
  MAMMOGRAM: 'mammogram',
  ECHOCARDIOGRAM: 'echocardiogram',
  ENDOSCOPY: 'endoscopy',
};

const IMAGING_TYPE_REF_IDS = {
  X_RAY: 'imagingType-XRay',
  CT_SCAN: 'imagingType-CTScan',
  ULTRASOUND: 'imagingType-Ultrasound',
  MAMMOGRAM: 'imagingType-Mammogram',
  ECHOCARDIOGRAM: 'imagingType-Echocardiogram',
  ENDOSCOPY: 'imagingType-Endoscopy',
};

const replacements = {
  xRayRefId: IMAGING_TYPE_REF_IDS.X_RAY,
  xRayText: IMAGING_TYPES.X_RAY,
  ctScanRefId: IMAGING_TYPE_REF_IDS.CT_SCAN,
  ctScanText: IMAGING_TYPES.CT_SCAN,
  ultrasoundRefId: IMAGING_TYPE_REF_IDS.ULTRASOUND,
  ultrasoundText: IMAGING_TYPES.ULTRASOUND,
  mammogramRefId: IMAGING_TYPE_REF_IDS.MAMMOGRAM,
  mammogramText: IMAGING_TYPES.MAMMOGRAM,
  echocardiogramRefId: IMAGING_TYPE_REF_IDS.ECHOCARDIOGRAM,
  echocardiogramText: IMAGING_TYPES.ECHOCARDIOGRAM,
  endoscopyRefId: IMAGING_TYPE_REF_IDS.ENDOSCOPY,
  endoscopyText: IMAGING_TYPES.ENDOSCOPY,
  itemTypeImaging: 'imagingType',
  unknownFallback: 'unknownImagingType',
};

export async function up(query) {
  await query.sequelize.query(
    `UPDATE ${INVOICE_LINE_TYPES_TABLE_NAME}
      SET
        item_id = CASE item_id
          WHEN :xRayRefId THEN :xRayText
          WHEN :ctScanRefId THEN :ctScanText
          WHEN :ultrasoundRefId THEN :ultrasoundText
          WHEN :mammogramRefId THEN :mammogramText
          WHEN :echocardiogramRefId THEN :echocardiogramText
          WHEN :endoscopyRefId THEN :endoscopyText
          ELSE :unknownFallback
          END
      WHERE item_type = :itemTypeImaging`,
    { replacements },
  );
  await query.sequelize.query(
    `DELETE FROM ${INVOICE_LINE_ITEMS_TABLE_NAME} i
      USING ${INVOICE_LINE_TYPES_TABLE_NAME} t
      WHERE i.invoice_line_type_id = t.id
      AND t.item_type = :itemTypeImaging
      AND t.item_id = :unknownFallback`,
    { replacements },
  );
  await query.sequelize.query(
    `DELETE FROM ${INVOICE_LINE_TYPES_TABLE_NAME}
    WHERE item_type = :itemTypeImaging
    AND item_id = :unknownFallback`,
    { replacements },
  );
}

export async function down(query) {
  await query.sequelize.query(
    `UPDATE ${INVOICE_LINE_TYPES_TABLE_NAME}
      SET
        item_id = CASE item_id
          WHEN :xRayText THEN :xRayRefId
          WHEN :ctScanText THEN :ctScanRefId
          WHEN :ultrasoundText THEN :ultrasoundRefId
          WHEN :mammogramText THEN :mammogramRefId
          WHEN :echocardiogramText THEN :echocardiogramRefId
          WHEN :endoscopyText THEN :endoscopyRefId
          END
      WHERE item_type = :itemTypeImaging`,
    { replacements },
  );
}
