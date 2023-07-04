import { STRING } from 'sequelize';

const IMAGING_REQUEST_TABLE_NAME = 'imaging_requests';

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
};

export async function up(query) {
  await query.addColumn(IMAGING_REQUEST_TABLE_NAME, 'imaging_type', {
    type: STRING(31),
    allowNull: true,
    defaultValue: null,
  });
  await query.sequelize.query(
    `
      UPDATE ${IMAGING_REQUEST_TABLE_NAME}
      SET
        imaging_type = CASE imaging_type_id
          WHEN :xRayRefId THEN :xRayText
          WHEN :ctScanRefId THEN :ctScanText
          WHEN :ultrasoundRefId THEN :ultrasoundText
          WHEN :mammogramRefId THEN :mammogramText
          WHEN :echocardiogramRefId THEN :echocardiogramText
          WHEN :endoscopyRefId THEN :endoscopyText
          END
    `,
    { replacements },
  );
  await query.removeColumn(IMAGING_REQUEST_TABLE_NAME, 'imaging_type_id');
}

export async function down(query) {
  await query.addColumn(IMAGING_REQUEST_TABLE_NAME, 'imaging_type_id', {
    type: STRING,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
  await query.sequelize.query(
    `
      UPDATE ${IMAGING_REQUEST_TABLE_NAME}
      SET
        imaging_type_id = CASE imaging_type
          WHEN :xRayText THEN :xRayRefId
          WHEN :ctScanText THEN :ctScanRefId
          WHEN :ultrasoundText THEN :ultrasoundRefId
          WHEN :mammogramText THEN :mammogramRefId
          WHEN :echocardiogramText THEN :echocardiogramRefId
          WHEN :endoscopyText THEN :endoscopyRefId
          END
    `,
    { replacements },
  );
  await query.removeColumn(IMAGING_REQUEST_TABLE_NAME, 'imaging_type');
}
