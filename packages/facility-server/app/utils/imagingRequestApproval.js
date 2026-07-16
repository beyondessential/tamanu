import { literal } from 'sequelize';

/**
 * @privateRemarks ImagingRequestArea items take precedence, then ImagingRequest items
 * @returns {[import('sequelize').Literal, 'approved']}
 */
export function getImagingRequestApprovedAttribute() {
  return [
    literal(`(
      SELECT COALESCE(
        -- ImagingRequestArea invoice items take precedence (NULL if none exist)
        (
          SELECT BOOL_AND(ii.approved)
          FROM imaging_request_areas ira
          INNER JOIN invoice_items ii ON ii.source_record_id = ira.id::text
            AND ii.source_record_type = 'ImagingRequestArea'
            AND ii.deleted_at IS NULL
          WHERE ira.imaging_request_id = "ImagingRequest".id
            AND ira.deleted_at IS NULL
          HAVING COUNT(*) > 0
        ),
        -- ImagingRequest invoice items (used if area items returned NULL)
        (
          SELECT BOOL_AND(ii.approved)
          FROM invoice_items ii
          WHERE ii.source_record_id = "ImagingRequest".id::text
            AND ii.source_record_type = 'ImagingRequest'
            AND ii.deleted_at IS NULL
          HAVING COUNT(*) > 0
        )
      )
    )`),
    'approved',
  ];
}

/**
 * Build a Sequelize order clause, with special handling for the computed `approved` field.
 * @param {string} [orderBy]
 * @param {string} [order]
 * @param {{ literalSortKeys?: string[] }} [options]
 */
export function getImagingRequestOrder(orderBy, order = 'ASC', options = {}) {
  if (!orderBy) return undefined;

  const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const { literalSortKeys = [] } = options;

  let nullPosition;
  if (orderBy === 'approved') {
    nullPosition = 'NULLS LAST';
  } else if (literalSortKeys.includes(orderBy)) {
    nullPosition = orderDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';
  }

  return [[...orderBy.split('.'), `${orderDirection}${nullPosition ? ` ${nullPosition}` : ''}`]];
}
