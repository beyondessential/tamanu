import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { deepRenameObjectKeys } from '@tamanu/shared/utils';
import { simpleGet, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import {
  makeFilter,
  makeSimpleTextFilterFactory,
  makeSubstringTextFilterFactory,
} from '../../utils/query';

export const programRegistry = express.Router();

programRegistry.get('/:id', simpleGet('ProgramRegistry'));
programRegistry.get(
  '/$',
  simpleGetList('ProgramRegistry', '', {
    additionalFilters: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  }),
);

programRegistry.get(
  '/:id/registrations',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientProgramRegistration },
      params: { id: programRegistryId },
      query,
    } = req;
    req.checkPermission('list', 'PatientProgramRegistration', { programRegistryId });

    const {
      order = 'ASC',
      orderBy = 'displayId',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const makeSimpleTextFilter = makeSimpleTextFilterFactory(filterParams);
    const makePartialTextFilter = makeSubstringTextFilterFactory(filterParams);
    const filters = [
      makePartialTextFilter('displayId', 'patient.display_id'),
      makeSimpleTextFilter('firstName', 'patient.first_name'),
      makeSimpleTextFilter('lastName', 'patient.last_name'),
      makeFilter(true, 'mrr.program_registry_id = :program_registry_id', () => ({
        program_registry_id: programRegistryId,
      })),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

    const withClause = `
      with
        most_recent_registrations as (
          SELECT *
          FROM (
            SELECT 
              *,
              ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
            FROM patient_program_registrations
          ) n
          WHERE n.row_num = 1
        ),
        conditions as (
          SELECT pprc.program_registry_id, patient_id, jsonb_agg(prc."name") condition_list  FROM patient_program_registration_conditions pprc
        join program_registry_conditions prc
        on pprc.program_registry_condition_id = prc.id
        group by pprc.program_registry_id, patient_id
        )
    `;
    const from = `
      FROM most_recent_registrations mrr
      left join patients patient
      on patient.id = mrr.patient_id
      left join reference_data patient_village
      on patient.village_id = patient_village.id
      left join reference_data currently_at_village
      on mrr.village_id = currently_at_village.id
      left join facilities currently_at_facility
      on mrr.facility_id = currently_at_facility.id
      left join facilities registering_facility
      on mrr.registering_facility_id = registering_facility.id
      left join conditions
      on conditions.patient_id = mrr.patient_id
      and conditions.program_registry_id = mrr.program_registry_id
      left join program_registry_clinical_statuses status
      on mrr.clinical_status_id = status.id
      left join program_registries program_registry
      on mrr.program_registry_id = program_registry.id
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const countResult = await req.db.query(`${withClause} SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

    const count = parseInt(countResult[0].count, 10);

    if (count === 0) {
      // save ourselves a query
      res.send({ data: [], count });
      return;
    }
    const sortKeys = {
      displayId: 'patient.display_id',
      patientName: 'UPPER(patient.last_name)',
      dob: 'patient.date_of_birth',
      homeVillage: 'UPPER(patient.village.name)',
      registeringFacility: 'registering_facility.name',
      currentlyAtVillage: 'UPPER(village.name)',
      currentlyAtFacility: 'UPPER(facility.name)',
      clinicalStatus: 'clinical_status',
    };

    const sortKey = sortKeys[orderBy] ?? sortKeys.displayId;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const nullPosition = sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';

    const result = await req.db.query(
      `
      ${withClause}
      select
        patient.id AS "patient.id",
        --
        -- Details for the table
        patient.display_id AS "patient.display_id",
        patient.first_name AS "patient.first_name",
        patient.last_name AS "patient.last_name",
        patient.date_of_birth AS "patient.date_of_birth",
        patient.date_of_death AS "patient.date_of_death",
        patient.sex AS "patient.sex",
        patient_village.name AS "patient.village.name",
        currently_at_village.name as "village.name",
        currently_at_facility.name as "facility.name",
        registering_facility.name as "registering_facility.name",
        conditions.condition_list as "conditions",
        status.name as "clinical_status.name",
        status.color as "clinical_status.color",
        program_registry.currently_at_type as "program_registry.currently_at_type",
        --
        -- Details for filtering/ordering
        patient.date_of_death as "patient.date_of_death",
        mrr.registration_status as "registration_status"
      ${from}

      ORDER BY ${sortKey} ${sortDirection}${nullPosition ? ` ${nullPosition}` : ''}
      LIMIT :limit
      OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          sortKey,
          sortDirection,
        },
        // The combination of these two parameters allow mapping the query results
        // to nested models
        model: PatientProgramRegistration,
        mapToModel: true,
        nest: true,
        raw: true,
        type: QueryTypes.SELECT,
      },
    );

    const forResponse = result.map(deepRenameObjectKeys);
    res.send({
      data: forResponse,
      count: 20008,
    });
  }),
);
