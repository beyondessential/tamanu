import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';

// spec: DIET
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

// A soft-deleted area is left joined away rather than filtered out, so its patients fall into the
// No area group instead of dropping off the sheet unfed. A soft-deleted bed does take its stale
// encounter off the sheet, matching what bed management itself shows.
// spec: DIET#who-appears-on-the-sheet
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
      AND location_groups.deleted_at IS NULL
    LEFT JOIN encounter_diets ON encounter_diets.encounter_id = encounters.id
      AND encounter_diets.deleted_at IS NULL
    LEFT JOIN reference_data diets ON diets.id = encounter_diets.diet_id
      AND diets.deleted_at IS NULL
  WHERE encounters.end_date IS NULL
    AND encounters.deleted_at IS NULL
    AND encounters.encounter_type IN (:encounterTypes)
    AND locations.facility_id = :facilityId
    AND locations.deleted_at IS NULL
    AND patients.deleted_at IS NULL
    ${hasArea ? 'AND locations.location_group_id = :areaId' : ''}
  ORDER BY location_groups.name NULLS LAST, locations.name, patients.last_name, patients.first_name
`;

const countByKey = patients =>
  patients.reduce((totals, { dietKeys }) => {
    for (const key of dietKeys) {
      totals[key] = (totals[key] ?? 0) + 1;
    }
    return totals;
  }, {});

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
    const { areaId } = await querySchema.parseAsync(req.query);

    const regularDietId = await req.settings[facilityId].get(
      'bedManagement.dietSummary.regularDietId',
    );
    const regularKey = regularDietId ?? UNCONFIGURED_REGULAR_KEY;

    const rows = await req.db.query(buildQuery(Boolean(areaId)), {
      replacements: {
        facilityId,
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

    // spec: DIET#diet-columns-and-counting
    const areas = [...areasByKey.values()].map(area => ({
      ...area,
      subTotals: countByKey(area.patients),
    }));
    const hospitalTotals = countByKey(allPatients);

    const regularDiet = regularDietId
      ? await req.models.ReferenceData.findByPk(regularDietId, { attributes: ['id', 'name'] })
      : null;
    const columns = Object.keys(hospitalTotals)
      .filter(key => key !== regularKey)
      .map(key => ({ key, name: dietNamesById.get(key) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (hospitalTotals[regularKey]) {
      // A null name is what tells the sheet to print its own translated Regular label
      columns.unshift({
        key: regularKey,
        name: regularDiet?.name ?? dietNamesById.get(regularKey) ?? null,
      });
    }

    res.send({ columns, hospitalTotals, areas });
  }),
);
