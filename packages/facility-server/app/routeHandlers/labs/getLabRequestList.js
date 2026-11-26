import asyncHandler from 'express-async-handler';
import { literal } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';

import { NOTE_RECORD_TYPES } from '@tamanu/constants/notes';

import { getResourceList } from '@tamanu/shared/utils/crudHelpers';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getLabRequestTestAndPanelNames } from '@tamanu/utils/labTests';

// Sorts on when a request reached the status it currently holds, which no column records. Its
// status changes are logged, so that moment is the newest log row carrying the status it still
// has. A request older than the log, or arrived without one, falls back to its requested date,
// which is also the tie-break so requests that reached their status together keep a fixed order.
//
// Log times are absolute while requested dates are primary-timezone strings, so the log time is
// rendered into that form rather than the two being compared across types. The subquery is served
// by lab_request_logs_lab_request_id_created_at.
const ORDER_BY_STATUS_REACHED_AT = 'statusReachedAt';

const buildStatusReachedAtOrder = (sequelize, direction) => () => [
  [
    literal(`COALESCE(
        (SELECT TO_CHAR(
                  MAX(status_log.created_at) AT TIME ZONE ${sequelize.escape(getPrimaryTimeZone())},
                  'YYYY-MM-DD HH24:MI:SS'
                )
           FROM lab_request_logs status_log
          WHERE status_log.lab_request_id = "LabRequest"."id"
            AND status_log.status = "LabRequest"."status"
            AND status_log.deleted_at IS NULL),
        "LabRequest"."requested_date")`),
    direction,
  ],
  ['requestedDate', direction],
];

export const getLabRequestList = (foreignKey = '', options = {}) =>
  asyncHandler(async (req, res) => {
    const { models, query, db } = req;
    const { includeNotes = false, status, excludeSensitive, orderBy, order = 'ASC' } = query;
    const newOptions = { ...options };

    // allow filter by status for encounter lab requests
    if (status) {
      newOptions.additionalFilters = {
        ...options.additionalFilters,
        status,
      };
    }

    if (orderBy === ORDER_BY_STATUS_REACHED_AT) {
      newOptions.buildOrder = buildStatusReachedAtOrder(db, order.toUpperCase());
    }

    const { data: labRequests, count } = await getResourceList(
      req,
      'LabRequest',
      foreignKey,
      newOptions,
    );

    // Sensitive requests are normally hidden only from users without the permission, but the
    // encounter results printout leaves them out for everyone, so callers can force the filter on.
    //
    // The filter runs over whatever getResourceList returned, not inside its query, so `count`
    // stays pre-filter and can exceed `data.length`. A caller that also pages gets short pages,
    // with no way to tell a filtered row from the end of the data — so don't combine
    // excludeSensitive with rowsPerPage; fetch the whole set and read its length.
    const canListSensitive = req.ability.can('list', 'SensitiveLabRequest');
    const mustExcludeSensitive = !canListSensitive || excludeSensitive === 'true';
    const permittedLabRequests = mustExcludeSensitive
      ? labRequests.filter(labRequest =>
          labRequest.tests.every(test => test.labTestType.isSensitive === false),
        )
      : labRequests;

    // Each request's panels + individual (non-panel) tests, for the Category cell tooltip. Built
    // from the associations the list query already loaded, so it adds no query.
    for (const labRequest of permittedLabRequests) {
      labRequest.testsAndPanelNames = getLabRequestTestAndPanelNames(labRequest).join(', ');
    }

    /**
     * Have to select associated note pages of lab request separately here.
     * This is because Sequelize has a bug that association scope field is not snake cased when underscored = true,
     * causing any models having Note as associations (ie: Patient, LabRequest,...)
     * not able to include Note as association when querying.
     *
     * eg: LabRequest model has association:
     * this.hasMany(models.Note, {
     *   foreignKey: 'recordId',
     *   as: 'notes',
     *   constraints: false,
     *   scope: {
     *      recordType: this.name,
     *   },
     * });
     *
     * In sequelize raw sql, it selects columns note.recordType instead of note.record_type,
     * which does not exist.
     *
     * More details: https://github.com/sequelize/sequelize-typescript/issues/740
     *  */

    if (!includeNotes) {
      res.send({ count, data: permittedLabRequests });
      return;
    }

    for (const labRequest of permittedLabRequests) {
      const notes = await models.Note.findAll({
        where: {
          recordId: labRequest.id,
          recordType: NOTE_RECORD_TYPES.LAB_REQUEST,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
      });

      labRequest.notes = notes;
    }

    res.send({ count, data: permittedLabRequests });
  });
