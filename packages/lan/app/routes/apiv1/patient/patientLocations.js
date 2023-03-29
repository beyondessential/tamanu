import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

const patientsLocationSelect = planned => `
  SELECT
  	locations.id,
  	COUNT(open_encounters)
  FROM locations
  LEFT JOIN (
  	SELECT ${planned ? 'planned_' : ''}location_id
  	FROM encounters
  	WHERE end_date IS NULL
  ) open_encounters
  ON locations.id = open_encounters.${planned ? 'planned_' : ''}location_id
  WHERE locations.facility_id = '${config.serverFacilityId}'
  AND locations.max_occupancy = 1
  GROUP BY locations.id
`;

export const patientLocations = express.Router();

patientLocations.get(
  '/locations/occupancy',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const [{ occupancy } = {}] = await req.db.query(
      `
        SELECT
          SUM(max_1_occupancy_locations.count) / COUNT(max_1_occupancy_locations) * 100 AS occupancy
        FROM (
          ${patientsLocationSelect()}
        ) max_1_occupancy_locations
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    res.send({
      data: occupancy,
    });
  }),
);

patientLocations.get(
  '/locations/stats',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const [
      { occupied_locations: occupiedLocations, available_locations: availableLocations } = {},
    ] = await req.db.query(
      `
        SELECT
          SUM(sign(max_1_occupancy_locations.count)) AS occupied_locations,
          COUNT(max_1_occupancy_locations) - SUM(sign(max_1_occupancy_locations.count)) AS available_locations
        FROM (
          ${patientsLocationSelect()}
        ) max_1_occupancy_locations
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    const [{ reserved_locations: reservedLocations } = {}] = await req.db.query(
      `
        SELECT
          SUM(sign(max_1_occupancy_locations.count)) AS reserved_locations
        FROM (
          ${patientsLocationSelect(true)}
        ) max_1_occupancy_locations
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    res.send({
      data: {
        availableLocations,
        reservedLocations,
        occupiedLocations,
      },
    });
  }),
);
