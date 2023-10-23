import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { startOfDay, endOfDay } from 'date-fns';
import { QueryTypes } from 'sequelize';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import { LAB_REQUEST_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { renameObjectKeys } from '@tamanu/shared/utils';
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
      // makeSimpleTextFilter('patientId', 'patient.id'),
      makeFilter(filterParams.departmentId, 'lab_requests.department_id = :departmentId'),
      makeFilter(filterParams.locationGroupId, 'location.location_group_id = :locationGroupId'),
      makeSimpleTextFilter('labTestPanelId', 'lab_test_panel.id'),
      makeFilter(
        filterParams.requestedDateFrom,
        'lab_requests.requested_date >= :requestedDateFrom',
        ({ requestedDateFrom }) => ({
          requestedDateFrom: toDateTimeString(startOfDay(new Date(requestedDateFrom))),
        }),
      ),
      makeFilter(
        filterParams.requestedDateTo,
        'lab_requests.requested_date <= :requestedDateTo',
        ({ requestedDateTo }) => ({
          requestedDateTo: toDateTimeString(endOfDay(new Date(requestedDateTo))),
        }),
      ),
      makeFilter(
        filterParams.status !== LAB_REQUEST_STATUSES.PUBLISHED,
        'lab_requests.status != :published',
        () => ({
          published: LAB_REQUEST_STATUSES.PUBLISHED,
        }),
      ),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const from = `
      FROM lab_requests
        LEFT JOIN encounters AS encounter
          ON (encounter.id = lab_requests.encounter_id)
        LEFT JOIN locations AS location
          ON (encounter.location_id = location.id)
        LEFT JOIN reference_data AS category
          ON (category.type = 'labTestCategory' AND lab_requests.lab_test_category_id = category.id)
        LEFT JOIN reference_data AS priority
          ON (priority.type = 'labTestPriority' AND lab_requests.lab_test_priority_id = priority.id)
        LEFT JOIN reference_data AS laboratory
          ON (laboratory.type = 'labTestLaboratory' AND lab_requests.lab_test_laboratory_id = laboratory.id)
        LEFT JOIN reference_data AS site
          ON (site.type = 'labSampleSite' AND lab_requests.lab_sample_site_id = site.id)
        LEFT JOIN lab_test_panel_requests AS lab_test_panel_requests
          ON (lab_test_panel_requests.id = lab_requests.lab_test_panel_request_id)
        LEFT JOIN lab_test_panels AS lab_test_panel
          ON (lab_test_panel.id = lab_test_panel_requests.lab_test_panel_id)
        LEFT JOIN patients AS patient
          ON (patient.id = encounter.patient_id)
        LEFT JOIN users AS examiner
          ON (examiner.id = encounter.examiner_id)
        LEFT JOIN users AS requester
          ON (requester.id = lab_requests.requested_by_id)
        ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

    const sortKeys = {
      displayId: 'patient.display_id',
      patientName: 'UPPER(patient.last_name)',
      requestedDate: 'requested_date',
      requestedBy: 'examiner.display_name',
      status: 'status',
    };

    const sortKey = sortKeys[orderBy];
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const nullPosition = sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';

    
  //   SELECT
  //   lab_requests.*,
  //   patient.display_id AS patient_display_id,
  //   patient.id AS patient_id,
  //   patient.first_name AS first_name,
  //   patient.last_name AS last_name,
  //   examiner.display_name AS examiner,
  //   requester.display_name AS requested_by,
  //   encounter.id AS encounter_id,
  //   category.id AS category_id,
  //   category.name AS category_name,
  //   priority.id AS priority_id,
  //   priority.name AS priority_name,
  //   lab_test_panel.name as lab_test_panel_name,
  //   laboratory.id AS laboratory_id,
  //   laboratory.name AS laboratory_name,
  //   location.facility_id AS facility_id
  // ${from}

  // ORDER BY ${sortKey} ${sortDirection}${nullPosition ? ` ${nullPosition}` : ''}
  // LIMIT :limit
  // OFFSET :offset
    const result = await req.db.query(
      `
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
        )
      select
        mrr.*,
        patient.display_id AS "patient.display_id",
        patient.id AS "patient.id",
          patient.first_name AS "patient.first_name",
          patient.last_name AS "patient.last_name",
          clinician.display_name as "patient.display_name"
      FROM most_recent_registrations mrr
      left join patients patient
      on patient.id = mrr.patient_id
      left join users clinician
      on clinician.id = mrr.clinician_id;
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          sortKey,
          sortDirection,
        },
        model: PatientProgramRegistration,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));
    res.send({
      data: forResponse,
      count: 20008,
    });
  }),
);
