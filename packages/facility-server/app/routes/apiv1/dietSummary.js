import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';

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

const NO_AREA_KEY = '';

const buildQuery = (hasArea) => `
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
    LEFT JOIN encounter_diets ON encounter_diets.encounter_id = encounters.id
      AND encounter_diets.deleted_at IS NULL
    LEFT JOIN reference_data diets ON diets.id = encounter_diets.diet_id
  WHERE encounters.end_date IS NULL
    AND encounters.deleted_at IS NULL
    AND encounters.encounter_type IN (:encounterTypes)
    AND locations.facility_id = :facilityId
    AND patients.deleted_at IS NULL
    ${hasArea ? 'AND locations.location_group_id = :areaId' : ''}
  ORDER BY location_groups.name NULLS LAST, locations.name, patients.last_name, patients.first_name
`;

const countByKey = (patients) =>
  patients.reduce((totals, { dietKeys }) => {
    for (const key of dietKeys) {
      totals[key] = (totals[key] ?? 0) + 1;
    }
    return totals;
  }, {});

const sumTotals = (areas) =>
  areas.reduce((totals, { subTotals }) => {
    for (const [key, count] of Object.entries(subTotals)) {
      totals[key] = (totals[key] ?? 0) + count;
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

    const { facilityId, areaId } = req.query;
    if (!facilityId) {
      throw new InvalidParameterError('A facility is required to build a diet summary.');
    }

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
      const areaKey = row.area_id ?? NO_AREA_KEY;
      if (!areasByKey.has(areaKey)) {
        areasByKey.set(areaKey, { id: row.area_id ?? null, name: row.area_name ?? null, patients: [] });
      }

      let patient = patientsByEncounter.get(row.encounter_id);
      if (!patient) {
        patient = {
          encounterId: row.encounter_id,
          displayId: row.display_id,
          firstName: row.first_name,
          lastName: row.last_name,
          bed: row.bed,
          dietKeys: [],
        };
        patientsByEncounter.set(row.encounter_id, patient);
        areasByKey.get(areaKey).patients.push(patient);
      }

      if (row.diet_id) {
        dietNamesById.set(row.diet_id, row.diet_name);
        patient.dietKeys.push(row.diet_id);
      }
    }

    for (const patient of patientsByEncounter.values()) {
      if (patient.dietKeys.length === 0) {
        patient.dietKeys.push(regularKey);
      }
    }

    const areas = [...areasByKey.values()].map(({ id, name, patients }) => ({
      id,
      name,
      patients,
      subTotals: countByKey(patients),
    }));
    const hospitalTotals = sumTotals(areas);

    const regularDiet = regularDietId
      ? await req.models.ReferenceData.findByPk(regularDietId, { attributes: ['id', 'name'] })
      : null;
    const columns = Object.keys(hospitalTotals)
      .filter((key) => key !== regularKey)
      .map((key) => ({ key, name: dietNamesById.get(key), isRegular: false }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (hospitalTotals[regularKey]) {
      columns.unshift({
        key: regularKey,
        name: regularDiet?.name ?? dietNamesById.get(regularKey) ?? null,
        isRegular: true,
      });
    }

    res.send({ columns, hospitalTotals, areas });
  }),
);
