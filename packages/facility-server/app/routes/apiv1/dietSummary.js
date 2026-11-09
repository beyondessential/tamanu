import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { ENCOUNTER_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';

// spec: DIETSUM
export const dietSummary = express.Router();

const DIET_SUMMARY_ENCOUNTER_TYPES = [
  ENCOUNTER_TYPES.ADMISSION,
  ENCOUNTER_TYPES.TRIAGE,
  ENCOUNTER_TYPES.OBSERVATION,
  ENCOUNTER_TYPES.EMERGENCY,
];

// Column key for the patients with no diet recorded when no diet is configured as the regular
// meal. A deployment whose own diet carries this id simply shares the column, which is where
// those patients belong anyway.
const UNCONFIGURED_REGULAR_KEY = 'regular';

const querySchema = z.object({
  areaId: z.string().min(1).optional(),
});

// A soft-deleted area, or one belonging to another facility, is left joined away rather than
// filtered out, so its patients fall into the No area group instead of printing a foreign ward's
// name or dropping off the sheet unfed. Only a deleted bed takes its encounter off the sheet;
// a merely retired one still holds a patient who needs feeding.
// Nothing constrains encounter_diets.diet_id to diet reference data, so the join checks the type.
// spec: DIETSUM#who-appears-on-the-sheet
//
// The facility and area scope is the set of that facility's own bed ids rather than a filter on
// the joined location, so the planner reaches the encounters through encounters_location_id
// instead of walking every open encounter the server holds to return one facility's few hundred:
// a facility server can host several facilities, and encounters nobody closed accumulate over a
// deployment's life. ARRAY(...) rather than IN (...), which is flattened into a join and planned
// from the encounters again; the array is resolved first and used as an index condition. The
// joined location is the same row by primary key, so it carries the facility, the area and
// deleted_at the subquery already checked.
const buildQuery = hasArea => `
  SELECT
    location_groups.id AS area_id,
    location_groups.name AS area_name,
    locations.name AS bed,
    encounters.id AS encounter_id,
    patients.display_id,
    patients.first_name,
    patients.last_name,
    diets.id AS diet_id,
    diets.name AS diet_name
  FROM encounters
    INNER JOIN locations ON locations.id = encounters.location_id
    INNER JOIN patients ON patients.id = encounters.patient_id
    LEFT JOIN location_groups ON location_groups.id = locations.location_group_id
      AND location_groups.facility_id = :facilityId
      AND location_groups.deleted_at IS NULL
    LEFT JOIN encounter_diets ON encounter_diets.encounter_id = encounters.id
      AND encounter_diets.deleted_at IS NULL
    LEFT JOIN reference_data diets ON diets.id = encounter_diets.diet_id
      AND diets.type = :dietType
      AND diets.deleted_at IS NULL
  WHERE encounters.location_id = ANY(ARRAY(
      SELECT id FROM locations
      WHERE facility_id = :facilityId
        AND deleted_at IS NULL
        ${hasArea ? 'AND location_group_id = :areaId' : ''}
    ))
    AND encounters.end_date IS NULL
    AND encounters.deleted_at IS NULL
    AND encounters.encounter_type IN (:encounterTypes)
    AND patients.deleted_at IS NULL
  ORDER BY location_groups.name NULLS LAST, locations.name, patients.last_name, patients.first_name
`;

// Constrained to diet reference data, so a setting pointed at a village or a drug falls back to
// the generic Regular label rather than printing that record's name as the column header.
const lookupDietName = async (models, dietId) => {
  const diet = await models.ReferenceData.findOne({
    where: { id: dietId, type: REFERENCE_TYPES.DIET },
    attributes: ['name'],
  });
  return diet?.name ?? null;
};

// Keyed by reference data id, and `__proto__` and `constructor` are ids the importer and the
// admin panel both accept: over a plain object the first silently drops its patients from every
// total and the second prints Object's source where a count belongs. The counts are the only
// thing here keyed by id that is not a Map or a Set.
const countByKey = patients =>
  patients.reduce((totals, { dietKeys }) => {
    for (const key of dietKeys) {
      totals[key] = (totals[key] ?? 0) + 1;
    }
    return totals;
  }, Object.create(null));

dietSummary.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');
    req.checkPermission('read', 'LocationGroup');
    req.checkPermission('read', 'Location');
    req.checkPermission('read', 'Encounter');

    const { facilityId } = req;
    if (!facilityId) {
      throw new InvalidOperationError('A diet summary needs a session signed in to a facility');
    }
    // `/setFacility` issues a token for any facility the user may access rather than only the
    // ones this server hosts, so the reader can be missing, a prototype member, or the
    // server-wide `global` reader. Only a reader for this very facility will do.
    const facilitySettings = req.settings[facilityId];
    if (facilitySettings?.facilityId !== facilityId) {
      throw new InvalidOperationError('A diet summary needs a facility this server hosts');
    }
    const { areaId } = await querySchema.parseAsync(req.query);

    const regularDietId = await facilitySettings.get('bedManagement.dietSummary.regularDietId');
    const regularKey = regularDietId ?? UNCONFIGURED_REGULAR_KEY;

    const rows = await req.db.query(buildQuery(Boolean(areaId)), {
      replacements: {
        facilityId,
        dietType: REFERENCE_TYPES.DIET,
        encounterTypes: DIET_SUMMARY_ENCOUNTER_TYPES,
        ...(areaId ? { areaId } : {}),
      },
      type: QueryTypes.SELECT,
    });

    const dietNamesById = new Map();
    const areasByKey = new Map();
    const patientsByEncounter = new Map();

    for (const row of rows) {
      if (!areasByKey.has(row.area_id)) {
        areasByKey.set(row.area_id, { id: row.area_id, name: row.area_name, patients: [] });
      }

      let patient = patientsByEncounter.get(row.encounter_id);
      if (!patient) {
        patient = {
          encounterId: row.encounter_id,
          displayId: row.display_id,
          firstName: row.first_name,
          lastName: row.last_name,
          bed: row.bed,
          dietKeys: new Set(),
        };
        patientsByEncounter.set(row.encounter_id, patient);
        areasByKey.get(row.area_id).patients.push(patient);
      }

      if (row.diet_id) {
        dietNamesById.set(row.diet_id, row.diet_name);
        // A Set, because nothing stops the same diet being recorded against an encounter twice,
        // and a patient the sheet ticks once must be counted once
        patient.dietKeys.add(row.diet_id);
      }
    }

    const allPatients = [...patientsByEncounter.values()];
    for (const patient of allPatients) {
      patient.dietKeys = patient.dietKeys.size > 0 ? [...patient.dietKeys] : [regularKey];
    }

    // spec: DIETSUM#diet-columns-and-counting
    const areas = [...areasByKey.values()].map(area => ({
      ...area,
      subTotals: countByKey(area.patients),
    }));
    const hospitalTotals = countByKey(allPatients);

    // Left unsorted: the sheet sorts the columns by the names it displays, which are translated,
    // so isRegular is what tells it which column leads rather than the order or the name.
    const columns = Object.keys(hospitalTotals)
      .filter(key => key !== regularKey)
      .map(key => ({ key, name: dietNamesById.get(key), isRegular: false }));

    if (hospitalTotals[regularKey]) {
      // The rows already name the regular diet wherever a patient is on it, so only a sheet with
      // nobody on it costs a lookup. A null name tells the sheet to print its own Regular label.
      const name =
        dietNamesById.get(regularKey) ??
        (regularDietId ? await lookupDietName(req.models, regularDietId) : null);
      columns.unshift({ key: regularKey, name, isRegular: true });
    }

    res.send({ columns, hospitalTotals, areas });
  }),
);
