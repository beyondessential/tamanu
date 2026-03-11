import { QueryTypes } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { mapKeys, camelCase, upperFirst } from 'lodash';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { FHIR_DATETIME_PRECISION } from '@tamanu/constants/fhir';
import { parseDateTime, formatFhirDate } from '@tamanu/shared/utils/fhir/datetime';

import { requireClientHeaders } from '../../middleware/requireClientHeaders';
import { InvalidOperationError } from '@tamanu/errors';

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
SELECT 
  last_updated::timestamptz at time zone 'UTC' as last_updated,
  patient_id,
  first_name,
  last_name,
  date_of_birth,
  age,
  sex,
  patient_billing_type,
  encounter_id,
  encounter_start_date,
  encounter_end_date,
  discharge_date,
  encounter_type,
  weight,
  visit_type,
  episode_end_status,
  encounter_discharge_disposition,
  triage_category,
  wait_time,
  departments,
  locations,
  reason_for_encounter,
  diagnoses,
  medications,
  vaccinations,
  procedures,
  lab_requests,
  imaging_requests,
  notes
FROM fhir.non_fhir_medici_report

WHERE true
  AND coalesce(patient_billing_id, '-') LIKE coalesce($billing_type, '%%')
  AND encounter_end_date IS NOT NULL
  AND CASE WHEN coalesce($from_date, 'not_a_date') != 'not_a_date'
    THEN last_updated >= $from_date::timestamptz at time zone $timezone_string
  ELSE
    true
  END
  AND CASE WHEN coalesce($to_date, 'not_a_date') != 'not_a_date'
    THEN last_updated <= $to_date::timestamptz at time zone $timezone_string
  ELSE
    true
  END
  AND CASE WHEN coalesce(array_length($input_encounter_ids::varchar[], 1), 0) != 0
    THEN encounter_id = ANY(SELECT unnest($input_encounter_ids::varchar[]))
  ELSE
    true
  END
  AND CASE WHEN coalesce($discharge_date_gt, 'not_a_date') != 'not_a_date'
    THEN encounter_end_date::timestamptz > $discharge_date_gt::timestamptz
    ELSE true
  END
  AND CASE WHEN coalesce($discharge_date_lt, 'not_a_date') != 'not_a_date'
    THEN encounter_end_date::timestamptz < $discharge_date_lt::timestamptz
    ELSE true
  END
  AND CASE WHEN coalesce($discharge_date_ge, 'not_a_date') != 'not_a_date'
    THEN encounter_end_date::timestamptz >= $discharge_date_ge::timestamptz
    ELSE true
  END
  AND CASE WHEN coalesce($discharge_date_le, 'not_a_date') != 'not_a_date'
    THEN encounter_end_date::timestamptz <= $discharge_date_le::timestamptz
    ELSE true
  END
  AND CASE WHEN coalesce($discharge_date_eq, 'not_a_date') != 'not_a_date'
    THEN encounter_end_date::timestamptz = $discharge_date_eq::timestamptz
    ELSE true
  END

ORDER BY last_updated DESC
LIMIT $limit OFFSET $offset;
`;

const DISCHARGE_DATE_PREFIXES = ['gt', 'lt', 'ge', 'le', 'eq'];

const parseDateParam = date => {
  const { plain: parsedDate } = parseDateTime(date, { withTz: COUNTRY_TIMEZONE });
  return parsedDate || null;
};

/**
 * Parse a discharge_date query value that may include a FHIR-style prefix (gt, lt, ge, le).
 * Uses the same parsing as period.start/period.end (parseDateParam), so timestamps without
 * an explicit timezone are interpreted in COUNTRY_TIMEZONE.
 */
const parseDischargeDateParam = param => {
  if (!param || typeof param !== 'string') return null;
  const trimmed = param.trim();
  const prefixMatch = DISCHARGE_DATE_PREFIXES.find(p => trimmed.startsWith(p));
  const prefix = prefixMatch || 'eq';
  const valueStr = prefixMatch ? trimmed.slice(prefixMatch.length) : trimmed;
  const parsed = parseDateParam(valueStr);
  return parsed ? { prefix, value: parsed } : null;
};

const checkTimePeriod = (fromDate, toDate) => {
  const fromParsed = new Date(parseDateParam(fromDate));
  const toParsed = new Date(parseDateParam(toDate));
  // Check if start & end time are within 1 hour
  return Math.abs(toParsed - fromParsed) <= 60 * 60 * 1000;
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
      discharge_date: dischargeDateParam,
    } = req.query;
    if (!COUNTRY_TIMEZONE) {
      throw new Error('A countryTimeZone must be configured in local.json5 for this report to run');
    }

    if (!encounters && (!fromDate || !toDate)) {
      throw new InvalidOperationError(
        'Must provide either an encounters list or both period.start and period.end query parameters',
      );
    }

    if (fromDate && !toDate) {
      throw new InvalidOperationError(
        'Must provide a period.end if proving a period.start query parameter',
      );
    }

    if (!fromDate && toDate) {
      throw new InvalidOperationError(
        'Must provide a period.start if proving a period.end query parameter',
      );
    }

    if (fromDate && toDate && !checkTimePeriod(fromDate, toDate)) {
      throw new InvalidOperationError('The time period must be within 1 hour');
    }

    const dischargeDateBind = {
      discharge_date_gt: null,
      discharge_date_lt: null,
      discharge_date_ge: null,
      discharge_date_le: null,
      discharge_date_eq: null,
    };
    const dischargeDateParams = [].concat(dischargeDateParam ?? []);
    for (const param of dischargeDateParams) {
      const parsed = parseDischargeDateParam(param);
      if (parsed) {
        const bindKey = `discharge_date_${parsed.prefix}`;
        if (Object.prototype.hasOwnProperty.call(dischargeDateBind, bindKey)) {
          dischargeDateBind[bindKey] = parsed.value;
        }
      }
    }

    const data = await sequelize.query(reportQuery, {
      type: QueryTypes.SELECT,
      bind: {
        from_date: fromDate ? parseDateParam(fromDate, COUNTRY_TIMEZONE) : null,
        to_date: toDate ? parseDateParam(toDate, COUNTRY_TIMEZONE) : null,
        input_encounter_ids: encounters?.split(',') ?? [],
        billing_type: null,
        limit: parseInt(limit, 10),
        offset, // Should still be able to offset even with no limit
        timezone_string: COUNTRY_TIMEZONE,
        ...dischargeDateBind,
      },
    });

    const mapNotes = notes =>
      notes?.map(note => ({
        ...note,
        noteDate: formatDate(note.noteDate),
      }));
    const mappedData = data.map(encounterData => {
      const encounter = mapKeys(encounterData, (_v, k) => camelCase(k));
      return {
        ...encounter,
        weight: parseFloat(encounter.weight),
        encounterStartDate: formatDate(new Date(encounter.encounterStartDate)),
        encounterEndDate: formatDate(new Date(encounter.encounterEndDate)),
        dischargeDate: formatDate(new Date(encounter.dischargeDate)),
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
        hoursOfVentilation: 0,
        leaveDays: 0,
        lastUpdated: formatDate(encounter.lastUpdated),
        medications: encounter.medications
          ?.filter(medication => !medication.isSensitive)
          // eslint-disable-next-line no-unused-vars
          ?.map(({ isSensitive, ...medication }) => medication),
      };
    });

    res.status(200).send({ data: mappedData });
  }),
);
