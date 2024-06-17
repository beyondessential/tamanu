import { REFERENCE_TYPES } from '@tamanu/constants';
import { QueryTypes } from 'sequelize';

/**
 * Query existing procedures, imaging requests, lab tests in the encounter,
 * compare if there have been corresponding invoice line items created,
 * and return the dummy potential invoice line items for the ones that have not been created yet.
 */
export const getPotentialInvoiceItems = async (db, models, encounterId, imagingTypes) => {
  const procedures = await db.query(
    `
        SELECT
        procedures.id AS "id",
        procedures.date AS "orderDate",
        procedures.physician_id AS "orderedByUserId",
        reference_data.code AS "code",
        reference_data.type AS "type",
        invoice_products.id AS "productId",
        invoice_products.price AS "price",
        invoice_products.name AS "name",
        users.display_name AS "orderedByUser.displayName"
        FROM procedures

        INNER JOIN invoice_products
        ON invoice_products.id = procedures.procedure_type_id

        INNER JOIN reference_data
        ON invoice_products.id = reference_data.id
        AND reference_data.type = :referenceDataType

        INNER JOIN users
        ON users.id = procedures.physician_id

        WHERE procedures.encounter_id = :encounterId
        AND procedures.deleted_at IS NULL;
    `,
    {
      replacements: {
        encounterId,
        referenceDataType: REFERENCE_TYPES.PROCEDURE_TYPE,
      },
      model: models.Procedure,
      type: QueryTypes.SELECT,
      mapToModel: true,
    },
  );

  const imagingRequests = await db.query(
    `
        SELECT
        imaging_requests.id AS "id",
        imaging_requests.requested_date AS "orderDate",
        imaging_requests.requested_by_id AS "orderedByUserId",
        imaging_type.code AS "code",
        :referenceDataType AS "type",
        invoice_products.id AS "productId",
        invoice_products.price AS "price",
        invoice_products.name AS "name",
        users.display_name AS "orderedByUser.displayName"
        FROM imaging_requests

        INNER JOIN invoice_products
        ON invoice_products.id = imaging_requests.imaging_type

        INNER JOIN (
          SELECT
            key, value->>'code' AS code FROM jsonb_each(:imagingTypes)) AS imaging_type
        ON invoice_products.id = imaging_type.key

        INNER JOIN users
        ON users.id = imaging_requests.requested_by_id

        WHERE imaging_requests.encounter_id = :encounterId
        AND imaging_requests.deleted_at IS NULL;
    `,
    {
      replacements: {
        encounterId,
        imagingTypes: JSON.stringify(imagingTypes),
        referenceDataType: REFERENCE_TYPES.IMAGING_TYPE,
      },
      model: models.ImagingRequest,
      type: QueryTypes.SELECT,
      mapToModel: true,
    },
  );

  const labTests = await db.query(
    `
        SELECT
        lab_tests.id AS "id",
        lab_test_types.code AS "code",
        lab_tests.date AS "orderDate",
        lab_requests.requested_by_id AS "orderedByUserId",
        :labTestType AS "type",
        invoice_products.id AS "productId",
        invoice_products.price AS "price",
        invoice_products.name AS "name",
        users.display_name AS "orderedByUser.displayName"
        FROM lab_tests

        INNER JOIN lab_requests
        ON lab_tests.lab_request_id = lab_requests.id

        INNER JOIN lab_test_types
        ON lab_tests.lab_test_type_id = lab_test_types.id

        INNER JOIN invoice_products
        ON lab_test_types.id = invoice_products.id

        INNER JOIN users
        ON users.id = lab_requests.requested_by_id

        WHERE lab_requests.encounter_id = :encounterId
        AND lab_requests.deleted_at IS NULL
    `,
    {
      replacements: {
        encounterId,
        labTestType: 'labTestType',
      },
      model: models.LabTest,
      type: QueryTypes.SELECT,
      mapToModel: true,
    },
  );

  return [...procedures, ...imagingRequests, ...labTests];
};
