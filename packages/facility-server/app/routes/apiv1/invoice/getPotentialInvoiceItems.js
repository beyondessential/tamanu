import { OTHER_REFERENCE_TYPES, REFERENCE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/shared/errors';
import { QueryTypes } from 'sequelize';

/**
 * Query existing procedures, imaging requests, lab tests in the encounter,
 * compare if there have been corresponding invoice line items created,
 * and return the dummy potential invoice line items for the ones that have not been created yet.
 * @param {import('sequelize').Sequelize} db
 * @param {string} invoiceId
 * @param {string[]} imagingTypes
 */
export const getPotentialInvoiceItems = async (db, invoiceId, imagingTypes) => {
  const encounterId = await db
    .query(`SELECT i."encounter_id" as "encounterId" from invoices i where i.id = :invoiceId`, {
      replacements: {
        invoiceId,
      },
      type: QueryTypes.SELECT,
      plain: true,
    })
    .then(invoice => invoice?.encounterId);

  if (!encounterId) throw new NotFoundError(`invoice ${invoiceId} not found`);

  return await db.query(
    `with filtered_procedures as (
	select
		rd.type as "sourceType",
		p.id as "sourceId",
		p.procedure_type_id as "productId",
		p."date",
		rd.code as "productCode",
		p.physician_id as "orderedByUserId"
	from "procedures" p
	join reference_data rd on rd.deleted_at is null and rd.id = p.procedure_type_id
	where p.deleted_at is null
	and p.encounter_id = :encounterId
),
filtered_imagings as (
	select
		:imagingType as "sourceType",
		ir.id as "sourceId",
		ir.imaging_type as "productId",
		ir."requested_date" as "date",
		rd.code as "productCode",
		ir.requested_by_id as "orderedByUserId"
	from imaging_requests ir
	join (
		select
			"unnest" as "id",
			"unnest" as "code"
		from unnest(array[:imagingTypes])
	) as rd on rd.id = ir.imaging_type
	where ir.deleted_at is null
	and ir.encounter_id = :encounterId
),
filtered_labtests as (
	select
		:labtestType as "sourceType",
		lt.id as "sourceId",
		lt.lab_test_type_id as "productId",
		lt."date",
		ltt.code as "productCode",
		lr.requested_by_id as "orderedByUserId"
	from lab_tests lt
	join lab_requests lr on lr.deleted_at is null and lr.id = lt.lab_request_id
	join lab_test_types ltt on ltt.deleted_at is null and ltt.id = lt.lab_test_type_id
	where lt.deleted_at is null
	and lr.encounter_id = :encounterId
),
filtered_products as (
	select
		ip.id,
		ip.name,
		ip.price
	from invoice_products ip
	where ip.deleted_at is null and ip.visibility_status = :visibilityStatus
)
select
	fpd.id as "productId",
	coalesce(fpc."productCode",fi."productCode",fl."productCode") as "productCode",
	coalesce(fpc."sourceType",fi."sourceType",fl."sourceType") as "productType",
	fpd.name as "productName",
	fpd.price as "productPrice",
	coalesce(fpc."date",fi."date",fl."date") as "orderDate",
	coalesce(fpc."sourceId",fi."sourceId",fl."sourceId") as "sourceId",
	coalesce(fpc."orderedByUserId",fi."orderedByUserId",fl."orderedByUserId") as "orderedByUserId",
	u.display_name as "orderedByUser.displayName"
from filtered_products fpd
left join filtered_procedures fpc on fpc."productId" = fpd.id
left join filtered_imagings fi on fi."productId" = fpd.id
left join filtered_labtests fl on fl."productId" = fpd.id
join users u on u.deleted_at is null and coalesce(fpc."orderedByUserId",fi."orderedByUserId",fl."orderedByUserId") = u.id;`,
    {
      replacements: {
        encounterId,
        imagingType: REFERENCE_TYPES.IMAGING_TYPE,
        imagingTypes,
        labtestType: OTHER_REFERENCE_TYPES.LAB_TEST_TYPE,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT
      },
      type: QueryTypes.SELECT,
    },
  );
};
