import { QueryTypes } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { upperFirst } from 'lodash';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { FHIR_DATETIME_PRECISION } from '@tamanu/constants/fhir';
import { parseDateTime, formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';
import config from 'config';

import { requireClientHeaders } from '../../middleware/requireClientHeaders';

export const routes = express.Router();

const COUNTRY_TIMEZONE = config?.countryTimeZone;

// Workaround for this test changing from a hotfix, see EPI-483/484
function formatDate(date) {
  if (!date) return date;
  return formatInTimeZone(
    parseISO(formatFhirDate(date, FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE)),
    '+00:00',
    "yyyy-MM-dd'T'HH:mm:ssXXX",
  ).replace(/Z$/, '+00:00');
}

const reportQuery = `
SELECT * FROM fhir.non_fhir_medici_report

WHERE true
  AND coalesce(patient_billing_id, '-') LIKE coalesce($billing_type, '%%')
  AND encounter_end_date IS NOT NULL
  AND CASE WHEN coalesce($from_date, 'not_a_date') != 'not_a_date'
    THEN (last_updated::timestamp at time zone $timezone_string) >= $from_date::timestamptz
  ELSE
    true
  END
  AND CASE WHEN coalesce($to_date, 'not_a_date') != 'not_a_date'
    THEN (last_updated::timestamp at time zone $timezone_string) <= $to_date::timestamptz
  ELSE
    true
  END
  AND CASE WHEN coalesce(array_length($input_encounter_ids::varchar[], 1), 0) != 0
    THEN encounter_id = ANY(SELECT unnest($input_encounter_ids::varchar[]))
  ELSE
    true
  END

ORDER BY last_updated DESC
LIMIT $limit OFFSET $offset;
`;

const parseDateParam = date => {
  const { plain: parsedDate } = parseDateTime(date, { withTz: COUNTRY_TIMEZONE });
  return parsedDate || null;
};

routes.use(requireClientHeaders);
routes.get(
  '/',
  asyncHandler(async (req, res) => {
    const { sequelize } = req.store;
    const {
      'period.start': fromDate,
      'period.end': toDate,
      limit = 100,
      encounters,
      offset = 0,
    } = req.query;
    if (!COUNTRY_TIMEZONE) {
      throw new Error('A countryTimeZone must be configured in local.json for this report to run');
    }

    const data = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
      bind: {
        from_date: parseDateParam(fromDate, COUNTRY_TIMEZONE),
        to_date: parseDateParam(toDate, COUNTRY_TIMEZONE),
        input_encounter_ids: encounters?.split(',') ?? [],
        billing_type: null,
        limit: parseInt(limit, 10),
        offset, // Should still be able to offset even with no limit
        timezone_string: COUNTRY_TIMEZONE,
      },
    });

    const mapNotes = notes =>
      notes?.map(note => ({
        ...note,
        noteDate: formatDate(note.noteDate),
      }));

    const mappedData = data.map(encounter => ({
      ...encounter,
      age: parseInt(encounter.age),
      weight: parseFloat(encounter.weight),
      sex: upperFirst(encounter.sex),
      departments: encounter.departments?.map(department => ({
        ...department,
        assignedTime: formatDate(department.assignedTime),
      })),
      locations: encounter.locations?.map(location => ({
        ...location,
        assignedTime: formatDate(location.assignedTime),
      })),
      imagingRequests: encounter.imagingRequests?.map(ir => ({
        ...ir,
        notes: mapNotes(ir.notes),
      })),
      labRequests: encounter.labRequests?.map(lr => ({
        ...lr,
        notes: mapNotes(lr.notes),
      })),
      procedures: encounter.procedures?.map(procedure => ({
        ...procedure,
        date: formatDate(procedure.date),
      })),
      notes: mapNotes(encounter.notes),
      encounterType: encounter.encounterType?.map(encounterType => ({
        ...encounterType,
        startDate: formatDate(encounterType.startDate),
      })),
    }));

    res.status(200).send({ data: mappedData });
  }),
);
