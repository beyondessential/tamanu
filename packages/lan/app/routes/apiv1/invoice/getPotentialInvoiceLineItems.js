import { QueryTypes } from 'sequelize';
import { INVOICE_LINE_ITEM_STATUSES } from '@tamanu/constants';

const getInvoiceLineNotExistYetClause = `invoice_line_types.id NOT IN (SELECT invoice_line_type_id
          FROM invoice_line_items
          INNER JOIN invoices
          ON invoice_line_items.invoice_id = invoices.id
          WHERE invoices.encounter_id = :encounterId
          AND invoice_line_items.status != :invoiceLineItemDeletedStatus
          )`;

/**
 * Query existing procedures, imaging requests, lab tests in the encounter,
 * compare if there have been corresponding invoice line items created,
 * and return the dummy potential invoice line items for the ones that have not been created yet.
 */
export const getPotentialInvoiceLineItems = async (db, models, encounterId, imagingTypes) => {
  const procedures = await db.query(
    `
        SELECT
        reference_data.name AS "name",
        reference_data.code AS "code",
        procedures.date AS "date",
        procedures.physician_id AS "orderedById",
        users.display_name AS "orderedBy",
        invoice_line_types.id AS "invoiceLineTypeId",
        invoice_line_types.item_type AS "type",
        invoice_line_types.price AS "price"
        FROM procedures
        INNER JOIN invoice_line_types
        ON invoice_line_types.item_id = procedures.procedure_type_id
        INNER JOIN reference_data
        ON invoice_line_types.item_id = reference_data.id
        AND invoice_line_types.item_type = 'procedureType'
        INNER JOIN users
        ON users.id = procedures.physician_id
        WHERE procedures.encounter_id = :encounterId
        AND ${getInvoiceLineNotExistYetClause};
    `,
    {
      replacements: {
        encounterId,
        invoiceLineItemDeletedStatus: INVOICE_LINE_ITEM_STATUSES.DELETED,
      },
      model: models.Procedure,
      type: QueryTypes.SELECT,
      mapToModel: true,
    },
  );

  const imagingRequests = await db.query(
    `
        SELECT
        imaging_type.label AS "name",
        imaging_type.code AS "code",
        imaging_requests.requested_date AS "date",
        imaging_requests.requested_by_id AS "orderedById",
        users.display_name AS "orderedBy",
        invoice_line_types.id AS "invoiceLineTypeId",
        invoice_line_types.item_type AS "type",
        invoice_line_types.price AS "price"
        FROM imaging_requests
        INNER JOIN invoice_line_types
        ON invoice_line_types.item_id = imaging_requests.imaging_type
        INNER JOIN (
          SELECT 
            key, value->>'code' AS code, value->>'label' AS label FROM jsonb_each(:imagingTypes)) AS imaging_type
        ON invoice_line_types.item_id = imaging_type.key
        INNER JOIN users
        ON users.id = imaging_requests.requested_by_id
        WHERE imaging_requests.encounter_id = :encounterId
        AND ${getInvoiceLineNotExistYetClause};
    `,
    {
      replacements: {
        encounterId,
        invoiceLineItemDeletedStatus: INVOICE_LINE_ITEM_STATUSES.DELETED,
        imagingTypes: JSON.stringify(imagingTypes),
      },
      model: models.ImagingRequest,
      type: QueryTypes.SELECT,
      mapToModel: true,
    },
  );

  const labTests = await db.query(
    `
        SELECT
        lab_test_types.name AS "name",
        lab_test_types.code AS "code",
        lab_tests.date AS "date",
        lab_requests.requested_by_id AS "orderedById",
        users.display_name AS "orderedBy",
        invoice_line_types.id AS "invoiceLineTypeId",
        invoice_line_types.item_type AS "type",
        invoice_line_types.price AS "price"
        FROM lab_tests
        INNER JOIN lab_requests
        ON lab_tests.lab_request_id = lab_requests.id
        INNER JOIN lab_test_types
        ON lab_tests.lab_test_type_id = lab_test_types.id
        INNER JOIN invoice_line_types
        ON invoice_line_types.item_id = lab_test_types.id
        AND invoice_line_types.item_type = 'labTestType'
        INNER JOIN users
        ON users.id = lab_requests.requested_by_id
        WHERE lab_requests.encounter_id = :encounterId
        AND ${getInvoiceLineNotExistYetClause};
    `,
    {
      replacements: {
        encounterId,
        invoiceLineItemDeletedStatus: INVOICE_LINE_ITEM_STATUSES.DELETED,
      },
      model: models.LabTest,
      type: QueryTypes.SELECT,
      mapToModel: true,
    },
  );

  return [...procedures, ...imagingRequests, ...labTests];
};
