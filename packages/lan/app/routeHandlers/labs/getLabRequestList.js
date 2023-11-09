import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';

import { NOTE_RECORD_TYPES } from '@tamanu/constants/notes';

import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

export const getLabRequestList = (foreignKey = '', options = {}) =>
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    const { includeNotes = false, status } = query;
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
      res.send({ count, data: labRequests });
      return;
    }

    for (const labRequest of labRequests) {
      const notes = await models.Note.findAll({
        where: {
          recordId: labRequest.id,
          recordType: NOTE_RECORD_TYPES.LAB_REQUEST,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
      });

      labRequest.notes = notes;
    }

    res.send({ count, data: labRequests });
  });
