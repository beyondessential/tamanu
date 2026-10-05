import Sequelize, { Op, QueryTypes } from 'sequelize';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { getDayBoundaries } from '@tamanu/utils/dateTime';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

import { checkNotePermission } from '../../utils/checkNotePermission';

export const noteListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { order = 'ASC', orderBy, noteTypeId, search, authorId, fromDate, toDate, rowsPerPage, page } = query;

    const recordId = params.id;
    await checkNotePermission(req, { recordType, recordId }, 'list');

    // Convert the date-only filter boundaries into stored datetime strings in the
    // primary timezone so they can be compared against the notes' stored dates.
    // Use the authenticated session's facility (never a client-supplied id) to
    // resolve the facility timezone.
    let fromDateTime;
    let toDateTime;
    if (fromDate || toDate) {
      const { facilityId } = req;
      const facilityTimeZone = facilityId
        ? await req.settings[facilityId]?.get('facilityTimeZone')
        : undefined;
      const primaryTimeZone = getPrimaryTimeZone(config);
      if (fromDate) {
        fromDateTime =
          getDayBoundaries(fromDate, primaryTimeZone, facilityTimeZone)?.start ??
          `${fromDate} 00:00:00`;
      }
      if (toDate) {
        toDateTime =
          getDayBoundaries(toDate, primaryTimeZone, facilityTimeZone)?.end ?? `${toDate} 23:59:59`;
      }
    }

    const include = [
      {
        model: models.User,
        as: 'author',
      },
      {
        model: models.User,
        as: 'onBehalfOf',
      },
      {
        model: models.ReferenceData,
        as: 'noteTypeReference',
      },
      {
        model: models.Note,
        as: 'revisedBy',
        required: false,
        attributes: ['date'],
        include: [
          {
            model: models.User,
            as: 'author',
          },
          {
            model: models.User,
            as: 'onBehalfOf',
          },
        ],
      },
    ];

    // Filtering happens after the edit chains have been resolved so that we never
    // include an earlier revision of a note that was excluded on its latest one.
    // The exception is the author filter, which intentionally matches against any
    // revision in the chain (original author or anyone who edited it).
    const filterClauses = [];
    const replacements = { recordType, recordId };

    if (noteTypeId) {
      filterClauses.push('latest.note_type_id = :noteTypeId');
      replacements.noteTypeId = noteTypeId;
    }
    if (search) {
      // Escape ILIKE wildcards (\ % _) so the user's input is matched literally
      // rather than treated as a pattern (backslash is Postgres' default LIKE escape).
      const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
      filterClauses.push('latest.content ILIKE :search');
      replacements.search = `%${escapedSearch}%`;
    }
    if (authorId) {
      // Match if the selected user authored or edited any revision in the chain,
      // whether as the author or on behalf of another user.
      filterClauses.push(`latest.edit_chain IN (
        SELECT edit_chain FROM this_record_notes
        WHERE author_id = :authorId OR on_behalf_of_id = :authorId
      )`);
      replacements.authorId = authorId;
    }
    if (fromDateTime) {
      filterClauses.push('roots.root_date >= :fromDateTime');
      replacements.fromDateTime = fromDateTime;
    }
    if (toDateTime) {
      filterClauses.push('roots.root_date <= :toDateTime');
      replacements.toDateTime = toDateTime;
    }

    const idRows = await models.Note.sequelize.query(
      `
      WITH

      -- first create a sub-table with only the notes for this record.
      -- this will make the DISTINCT stuff way faster
      this_record_notes AS (
        SELECT
          *,
          CASE WHEN revised_by_id IS NULL THEN id ELSE revised_by_id END edit_chain
        FROM notes n
        WHERE record_type = :recordType
          AND record_id = :recordId
          AND deleted_at IS NULL
      ),

      -- keep only the latest revision for each note (the currently visible content)
      latest AS (
        SELECT DISTINCT ON (edit_chain)
          id, edit_chain, content, note_type_id
        FROM this_record_notes
        ORDER BY edit_chain, date DESC
      ),

      -- the root (original) note of each chain, used for chronological date filtering
      roots AS (
        SELECT edit_chain, date AS root_date
        FROM this_record_notes
        WHERE revised_by_id IS NULL
      )

      SELECT latest.id
      FROM latest
      LEFT JOIN roots ON roots.edit_chain = latest.edit_chain
      ${filterClauses.length ? `WHERE ${filterClauses.join('\n        AND ')}` : ''}
    `,
      {
        type: QueryTypes.SELECT,
        replacements,
      },
    );

    const where = {
      id: {
        [Op.in]: idRows.map(x => x.id),
      },
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    };

    const queryOrder = orderBy
      ? [[orderBy, order.toUpperCase()]]
      : [
          [
            // Pin TREATMENT_PLAN on top
            Sequelize.literal(
              `case when "Note"."note_type_id" = '${NOTE_TYPES.TREATMENT_PLAN}' then 0 else 1 end`,
            ),
          ],
          [
            // If the note has already been revised then order by the root note's date.
            // If this is the root note then order by the date of this note
            Sequelize.literal(
              'case when "revisedBy"."date" notnull then "revisedBy"."date" else "Note"."date" end desc',
            ),
          ],
        ];

    const rows = await models.Note.findAll({
      include,
      where,
      order: queryOrder,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });
    const totalCount = await models.Note.count({
      where,
    });

    const editChains = [...new Set(rows.map(n => n.revisedById ?? n.id))];
    if (editChains.length > 0) {
      const chainCounts = await models.Note.sequelize.query(
        `
        SELECT
          CASE WHEN revised_by_id IS NULL THEN id ELSE revised_by_id END AS chain_id,
          COUNT(*) AS count
        FROM notes
        WHERE record_type = :recordType
          AND record_id = :recordId
          AND deleted_at IS NULL
          AND (CASE WHEN revised_by_id IS NULL THEN id ELSE revised_by_id END) IN (:editChains)
        GROUP BY chain_id
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { recordType, recordId, editChains },
        },
      );
      const countByChain = Object.fromEntries(
        chainCounts.map(({ chain_id, count }) => [chain_id, Number(count)]),
      );
      rows.forEach(note => {
        const chainId = note.revisedById ?? note.id;
        const totalInChain = countByChain[chainId] ?? 1;
        note.setDataValue('editCount', Math.max(0, totalInChain - 1));
      });
    }

    res.send({ data: rows, count: totalCount });
  });

export const notesWithSingleItemListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    const recordId = params.id;
    await checkNotePermission(req, { recordType, recordId }, 'list');

    const notes = await models.Note.findAll({
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
        { model: models.ReferenceData, as: 'noteTypeReference' },
      ],
      where: {
        recordId,
        recordType,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      order: [['date', 'DESC']],
    });

    res.send({ data: notes, count: notes.length });
  });
