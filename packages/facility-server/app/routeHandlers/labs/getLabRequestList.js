import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';

import { NOTE_RECORD_TYPES } from '@tamanu/constants/notes';

import { getResourceList } from '@tamanu/shared/utils/crudHelpers';
import { getLabRequestTestAndPanelNames } from '@tamanu/utils/labTests';

export const getLabRequestList = (foreignKey = '', options = {}) =>
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    const { includeNotes = false, status, excludeSensitive } = query;
    const newOptions = { ...options };

    // allow filter by status for encounter lab requests
    if (status) {
      newOptions.additionalFilters = {
        ...options.additionalFilters,
        status,
      };
    }

    const { data: labRequests, count } = await getResourceList(
      req,
      'LabRequest',
      foreignKey,
      newOptions,
    );

    // Sensitive requests are normally hidden only from users without the permission, but the
    // encounter results printout leaves them out for everyone, so callers can force the filter on.
    // The filter runs over the page getResourceList returned, so `count` stays pre-filter and can
    // exceed `data.length` — read the length, not the count, to tell whether anything is left.
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
