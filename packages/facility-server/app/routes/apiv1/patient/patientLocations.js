import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { objectToCamelCase } from '@tamanu/shared/utils';
import { LOCATION_AVAILABILITY_STATUS, VISIBILITY_STATUSES } from '@tamanu/constants';

const patientsLocationSelect = (planned, encountersWhereAndClauses) => `
  SELECT
  	locations.id,
  	COUNT(open_encounters)
  FROM locations
  LEFT JOIN (
  	SELECT ${planned ? 'planned_' : ''}location_id
  	FROM encounters
  	WHERE end_date IS NULL
    AND deleted_at IS NULL
    ${encountersWhereAndClauses ? `AND ${encountersWhereAndClauses}` : ''}
  ) open_encounters
  ON locations.id = open_encounters.${planned ? 'planned_' : ''}location_id
  WHERE locations.facility_id = '${config.serverFacilityId}'
  AND locations.max_occupancy = 1
  AND locations.deleted_at IS NULL
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
          (SUM(max_1_occupancy_locations.count) / COUNT(max_1_occupancy_locations) * 100)::float AS occupancy
        FROM (
          ${patientsLocationSelect(false, `encounters.encounter_type = 'admission'`)}
        ) max_1_occupancy_locations
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    res.send({
      data: occupancy || 0,
    });
  }),
);

patientLocations.get(
  '/locations/alos',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const [{ alos } = {}] = await req.db.query(
      `
        SELECT
          (SUM(EXTRACT(epoch from age(end_date::date, start_date::date)) / 86400) / COUNT(1))::float as alos
        FROM encounters
        LEFT JOIN locations
        ON encounters.location_id = locations.id
        WHERE end_date::date > now() - '30 days'::interval
        AND encounters.encounter_type = 'admission'
        AND locations.facility_id = $facilityId
        AND locations.deleted_at IS NULL
        AND encounters.deleted_at IS NULL
      `,
      {
        type: QueryTypes.SELECT,
        bind: {
          facilityId: config.serverFacilityId,
        },
      },
    );

    res.send({
      data: alos || 0,
    });
  }),
);

patientLocations.get(
  '/locations/readmissions',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const [{ count: readmissionsCount } = {}] = await req.db.query(
      `
        SELECT
          COUNT(readmitted_patients.id)::int
          FROM
          (
          SELECT
            encounters.patient_id as id,
            COUNT(encounters.patient_id)
          FROM encounters
          LEFT JOIN (
            SELECT
              id as previous_encounter_id,
              patient_id,
              encounter_type,
              end_date
            FROM encounters
          ) previous_encounters
          ON encounters.patient_id = previous_encounters.patient_id
          AND encounters.start_date::date - '30 days'::interval < previous_encounters.end_date::date
          LEFT JOIN locations
          ON locations.id = encounters.location_id
          WHERE encounters.end_date IS NULL
          AND encounters.start_date::date > now() - '30 days'::interval
          AND encounters.encounter_type = 'admission'
          AND previous_encounters.encounter_type = 'admission'
          AND previous_encounter_id IS NOT NULL
          AND locations.facility_id = $facilityId
          GROUP BY encounters.patient_id
          ORDER BY encounters.patient_id
          ) readmitted_patients
      `,
      {
        type: QueryTypes.SELECT,
        bind: {
          facilityId: config.serverFacilityId,
        },
      },
    );

    res.send({
      data: readmissionsCount,
    });
  }),
);

patientLocations.get(
  '/locations/stats',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const [
      {
        occupied_location_count: occupiedLocationCount,
        available_location_count: availableLocationCount,
      } = {},
    ] = await req.db.query(
      `
        SELECT
          SUM(sign(max_1_occupancy_locations.count)) AS occupied_location_count,
          COUNT(max_1_occupancy_locations) - SUM(sign(max_1_occupancy_locations.count)) AS available_location_count
        FROM (
          ${patientsLocationSelect()}
        ) max_1_occupancy_locations
      `,
      {
        type: QueryTypes.SELECT,
      },
    );

    const [{ reserved_location_count: reservedLocationCount } = {}] = await req.db.query(
      `
        SELECT
          SUM(sign(max_1_occupancy_locations.count)) AS reserved_location_count
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
        availableLocationCount: availableLocationCount || 0,
        reservedLocationCount: reservedLocationCount || 0,
        occupiedLocationCount: occupiedLocationCount || 0,
      },
    });
  }),
);

patientLocations.get(
  '/locations/bedManagement',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const { query } = req;

    const defaultRowsPerPage = 10;
    const defaultPage = 0;
    const defaultOrderBy = 'location';

    const {
      orderBy = defaultOrderBy,
      order = 'asc',
      rowsPerPage = defaultRowsPerPage,
      page = defaultPage,
      ...filterParams
    } = query;

    const withClauses = `
      WITH open_encounters AS (
        SELECT
          patient_id,
          location_id,
          planned_location_id
        FROM encounters
        WHERE end_date IS NULL
        AND deleted_at IS NULL
        ), open_encounters_with_patient_information AS (
        SELECT
          open_encounters.*,
          patients.id,
          patients.first_name,
          patients.last_name
        FROM open_encounters
        LEFT JOIN patients ON open_encounters.patient_id = patients.id
        )
    `;

    const from = `
      FROM
      (
        SELECT
          location_groups.id as area_id,
          location_groups.name as area,
          locations.id,
          locations.name as location,
          locations.max_occupancy,
          COUNT (open_encounters) as number_of_occupants
        FROM locations
        LEFT JOIN location_groups ON locations.location_group_id = location_groups.id
        LEFT JOIN open_encounters ON locations.id = open_encounters.location_id
        WHERE locations.facility_id = $facilityId 
        AND locations.visibility_status = $visibilityStatusCurrent
        AND locations.deleted_at IS NULL
        GROUP BY locations.id, location_groups.id
      ) locations
      LEFT JOIN (
        SELECT
          location_id,
          (SUM(EXTRACT(epoch from age(end_date::date, start_date::date)) / 86400) / COUNT(1))::float as alos
        FROM encounters
        WHERE end_date::date > now() - '30 days'::interval
        AND encounters.encounter_type = 'admission'
        AND encounters.deleted_at IS NULL
        GROUP BY location_id
      ) last_30_days_closed_encounters
      ON locations.id = last_30_days_closed_encounters.location_id
      LEFT JOIN (
      	SELECT
      	  location_id,
          (SUM(
        	  DATE_PART('day', age(
        	    CASE WHEN end_date IS NULL THEN now() ELSE end_date::date END,
        	    greatest(start_date::date, now() - '30 days'::interval)
      	  ))) * 100 / 30)::float as occupancy
      	FROM encounters
      	LEFT JOIN locations ON locations.id = encounters.location_id
      	WHERE (end_date::date > now() - '30 days'::interval OR end_date IS NULL)
      	AND locations.max_occupancy = 1
        AND encounters.deleted_at IS NULL
        AND locations.deleted_at IS NULL
      	GROUP BY location_id
      ) last_30_days_encounters
      ON locations.id = last_30_days_encounters.location_id
      LEFT JOIN open_encounters_with_patient_information AS patient_encounters
      ON locations.id = patient_encounters.location_id OR locations.id = patient_encounters.planned_location_id
      AND locations.max_occupancy = 1
      LEFT JOIN open_encounters_with_patient_information AS planned_patient_encounters
      ON patient_encounters.id = planned_patient_encounters.id
      AND locations.id = patient_encounters.planned_location_id
      AND locations.max_occupancy = 1
    `;

    const statusCaseStatement = `
      CASE WHEN locations.max_occupancy = 1
      AND planned_patient_encounters.patient_id IS NOT NULL
      THEN '${LOCATION_AVAILABILITY_STATUS.RESERVED}'
      ELSE (
        CASE WHEN patient_encounters.patient_id IS NULL
          OR locations.max_occupancy IS DISTINCT FROM 1
        THEN '${LOCATION_AVAILABILITY_STATUS.AVAILABLE}'
        ELSE '${LOCATION_AVAILABILITY_STATUS.OCCUPIED}'
        END
      )
      END
    `;

    const patientCaseStatement = patientKey =>
      `CASE WHEN locations.max_occupancy = 1 THEN patient_encounters.${patientKey} END`;

    const whereClauses = [
      ...(filterParams.status ? [`${statusCaseStatement} = $status`] : []),
      ...(filterParams.area ? [`area_id = $area`] : []),
      ...(filterParams.location ? [`locations.id = $location`] : []),
    ].join(' AND ');

    const SORT_KEYS = {
      area: 'area_id',
      location: 'location_id',
      alos: 'alos',
      occupancy: 'occupancy',
      numberOfOccupants: 'number_of_occupants',
      patientFirstName: `UPPER(${patientCaseStatement('first_name')})`,
      patientLastName: `UPPER(${patientCaseStatement('last_name')})`,
      status: 'status',
    };

    const sortBy = SORT_KEYS[orderBy] || SORT_KEYS[defaultOrderBy];
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const limit = isNaN(parseInt(rowsPerPage, 10)) ? defaultRowsPerPage : parseInt(rowsPerPage, 10);
    const offset = (isNaN(parseInt(page, 10)) ? defaultPage : parseInt(page, 10)) * limit;

    const orderLimitOffset = `
      ORDER BY ${sortBy} ${sortDirection}
      LIMIT $limit
      OFFSET $offset
    `;

    const bindParams = {
      ...(filterParams.status && { status: filterParams.status }),
      ...(filterParams.area && { area: filterParams.area }),
      ...(filterParams.location && { location: filterParams.location }),
      facilityId: config.serverFacilityId,
      visibilityStatusCurrent: VISIBILITY_STATUSES.CURRENT,
    };

    const data = await req.db.query(
      `
        ${withClauses}

        SELECT
          ROW_NUMBER () OVER (ORDER BY locations.id) as id,
          locations.area_id,
          locations.area,
          locations.id as location_id,
          locations.location,
          last_30_days_closed_encounters.alos,
          locations.max_occupancy as location_max_occupancy,
          last_30_days_encounters.occupancy,
          locations.number_of_occupants::int,
          ${patientCaseStatement('patient_id')} as patient_id,
        	${patientCaseStatement('first_name')} as patient_first_name,
        	${patientCaseStatement('last_name')} as patient_last_name,
          ${statusCaseStatement} as status
        ${from}
        ${whereClauses ? `WHERE ${whereClauses}` : ''}
        ${orderLimitOffset}
      `,
      {
        type: QueryTypes.SELECT,
        bind: {
          ...bindParams,
          limit,
          offset,
        },
      },
    );

    const [{ count } = {}] = await req.db.query(
      `
        ${withClauses}

        SELECT COUNT(1)
        ${from}
        ${whereClauses && `WHERE ${whereClauses}`}
      `,
      {
        type: QueryTypes.SELECT,
        bind: bindParams,
      },
    );

    res.send({
      data: data.map(entry => objectToCamelCase(entry)),
      count: parseInt(count, 10),
    });
  }),
);
