import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from '@tamanu/constants/importable';

import { NOTE_RECORD_TYPES } from '@tamanu/constants/notes';

import { getResourceList } from 'shared/utils/crudHelpers';

export const getLabRequestList = (foreignKey = '', options = {}) =>
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    const { includeNotePages = false, status } = query;
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
     * causing any models having NotePage as associations (ie: Patient, LabRequest,...)
     * not able to include NotePage as association when querying.
     *
     * eg: LabRequest model has association:
     * this.hasMany(models.NotePage, {
     *   foreignKey: 'recordId',
     *   as: 'notePages',
     *   constraints: false,
     *   scope: {
     *      recordType: this.name,
     *   },
     * });
     *
     * In sequelize raw sql, it selects columns NotePage.recordType instead of NotePage.record_type,
     * which does not exist.
     *
     * More details: https://github.com/sequelize/sequelize-typescript/issues/740
     *  */

    if (!includeNotePages) {
      res.send({ count, data: labRequests });
      return;
    }

    for (const labRequest of labRequests) {
      const notePages = await models.NotePage.findAll({
        include: [
          {
            model: models.NoteItem,
            as: 'noteItems',
          },
        ],
        where: {
          recordId: labRequest.id,
          recordType: NOTE_RECORD_TYPES.LAB_REQUEST,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
      });

      labRequest.notePages = notePages;
    }

    res.send({ count, data: labRequests });
  });
