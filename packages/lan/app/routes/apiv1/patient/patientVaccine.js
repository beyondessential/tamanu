import express from 'express';
import asyncHandler from 'express-async-handler';
import Sequelize, { QueryTypes, Op } from 'sequelize';
import config from 'config';

import {
  ENCOUNTER_TYPES,
  VACCINE_CATEGORIES,
  VACCINE_STATUS,
  SETTING_KEYS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { NotFoundError } from 'shared/errors';
import { getCurrentDateString } from 'shared/utils/dateTime';

export const patientVaccineRoutes = express.Router();

const asRealNumber = value => {
  let num = value;
  if (typeof num === 'string') {
    num = Number.parseInt(value, 10);
  }
  if (typeof num !== 'number' || Number.isNaN(num) || !Number.isFinite(num)) {
    throw new Error(`asRealNumber: expected real numeric string or number, got ${value}`);
  }
  return num;
};

patientVaccineRoutes.get(
  '/:id/scheduledVaccines',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientVaccine');

    const filter = {};
    let whereClause = '';
    if (req.query.category) {
      filter.category = req.query.category;
      whereClause = ' WHERE sv.category = :category';
    }

    const results = await req.db.query(
      `
      SELECT
        sv.id
        , max(sv.category) AS category
        , max(sv.label) AS label
        , max(sv.schedule) AS schedule
        , max(sv.weeks_from_birth_due) AS weeks_from_birth_due
        , max(sv.vaccine_id) AS vaccine_id
        , max(sv.visibility_status) AS visibility_status
        , count(av.id) AS administered
        FROM scheduled_vaccines sv
        LEFT JOIN (
          SELECT
            av.*
          FROM
            administered_vaccines av
            JOIN encounters e ON av.encounter_id = e.id
          WHERE
            e.patient_id = :patientId) av ON sv.id = av.scheduled_vaccine_id AND av.status = :givenStatus
        ${whereClause}
        GROUP BY sv.id
        ORDER BY sv.index, max(sv.label), max(sv.schedule);
      `,
      {
        replacements: {
          patientId: req.params.id,
          category: req.query.category,
          givenStatus: VACCINE_STATUS.GIVEN,
        },
        model: req.models.ScheduledVaccine,
        mapToModel: true,
        type: QueryTypes.SELECT,
      },
    );

    const vaccines = results
      .map(s => s.get({ plain: true }))
      .reduce((allVaccines, vaccineSchedule) => {
        if (!allVaccines[vaccineSchedule.label]) {
          const { administered, ...rest } = vaccineSchedule;
          rest.schedules = [];
          // eslint-disable-next-line no-param-reassign
          allVaccines[vaccineSchedule.label] = rest;
        }
        const administered = asRealNumber(vaccineSchedule.administered) > 0;
        // Exclude historical schedules unless administered
        if (vaccineSchedule.visibilityStatus !== VISIBILITY_STATUSES.HISTORICAL || administered) {
          allVaccines[vaccineSchedule.label].schedules.push({
            schedule: vaccineSchedule.schedule,
            scheduledVaccineId: vaccineSchedule.id,
            administered,
          });
        }
        return allVaccines;
      }, {});

    // Exclude vaccines that already have all the schedules administered for the patient
    const availableVaccines = Object.values(vaccines).filter(v =>
      v.schedules.some(s => !s.administered),
    );
    res.send(availableVaccines);
  }),
);

patientVaccineRoutes.put(
  '/:id/administeredVaccine/:vaccineId',
  asyncHandler(async (req, res) => {
    const { db, models, params } = req;
    req.checkPermission('read', 'PatientVaccine');
    const updatedVaccineData = req.body;
    const vaccine = await models.AdministeredVaccine.findByPk(params.vaccineId);
    if (!vaccine) throw new NotFoundError();
    req.checkPermission('write', 'PatientVaccine');

    const updatedVaccine = await db.transaction(async () => {
      await vaccine.update(updatedVaccineData);

      if (updatedVaccineData.status === VACCINE_STATUS.RECORDED_IN_ERROR) {
        const encounter = await models.Encounter.findByPk(vaccine.encounterId);

        // If encounter type is VACCINATION, it means the encounter only has vaccine attached to it
        if (encounter.encounterType === ENCOUNTER_TYPES.VACCINATION) {
          encounter.reasonForEncounter = `${encounter.reasonForEncounter} reverted`;
          await encounter.save();
        }
      }

      return vaccine;
    });
    res.send(updatedVaccine);
  }),
);

async function getVaccinationDescription(models, vaccineData) {
  const scheduledVaccine = await models.ScheduledVaccine.findByPk(vaccineData.scheduledVaccineId, {
    include: 'vaccine',
  });

  const prefixMessage =
    vaccineData.status === VACCINE_STATUS.GIVEN
      ? 'Vaccination recorded for'
      : 'Vaccination recorded as not given for';
  const vaccineDetails =
    vaccineData.category === VACCINE_CATEGORIES.OTHER
      ? [vaccineData.vaccineName]
      : [scheduledVaccine.vaccine?.name, scheduledVaccine.schedule];
  return [prefixMessage, ...vaccineDetails].filter(Boolean).join(' ');
}

patientVaccineRoutes.post(
  '/:id/administeredVaccine',
  asyncHandler(async (req, res) => {
    const { db } = req;
    req.checkPermission('create', 'PatientVaccine');

    // Require scheduledVaccineId if vaccine category is not OTHER
    if (req.body.category !== VACCINE_CATEGORIES.OTHER && !req.body.scheduledVaccineId) {
      res.status(400).send({ error: { message: 'scheduledVaccineId is required' } });
    }

    if (!req.body.status) {
      res.status(400).send({ error: { message: 'status is required' } });
    }

    const { models } = req;
    const patientId = req.params.id;
    const vaccineData = { ...req.body };

    if (vaccineData.category === VACCINE_CATEGORIES.OTHER) {
      vaccineData.scheduledVaccineId = (
        await models.ScheduledVaccine.getOtherCategoryScheduledVaccine()
      )?.id;
    }

    const existingEncounter = await models.Encounter.findOne({
      where: {
        endDate: {
          [Op.is]: null,
        },
        patientId,
      },
    });

    let { departmentId, locationId } = vaccineData;

    if (!departmentId || !locationId) {
      const vaccinationDefaults =
        (await models.Setting.get(
          vaccineData.givenElsewhere
            ? SETTING_KEYS.VACCINATION_GIVEN_ELSEWHERE_DEFAULTS
            : SETTING_KEYS.VACCINATION_DEFAULTS,
          config.serverFacilityId,
        )) || {};
      departmentId = departmentId || vaccinationDefaults.departmentId;
      locationId = locationId || vaccinationDefaults.locationId;
    }

    const currentDate = getCurrentDateString();

    const newAdministeredVaccine = await db.transaction(async () => {
      let encounterId;
      if (existingEncounter) {
        encounterId = existingEncounter.get('id');
      } else {
        const newEncounter = await req.models.Encounter.create({
          encounterType: ENCOUNTER_TYPES.VACCINATION,
          startDate: vaccineData.date || currentDate,
          patientId,
          examinerId: vaccineData.recorderId,
          locationId,
          departmentId,
          reasonForEncounter: await getVaccinationDescription(req.models, vaccineData),
        });
        await newEncounter.update({
          endDate: vaccineData.date || currentDate,
          systemNote: 'Automatically discharged',
          discharge: {
            note: 'Automatically discharged after giving vaccine',
          },
        });
        encounterId = newEncounter.get('id');
      }

      // When recording a GIVEN vaccine, check and update
      // any existing NOT_GIVEN vaccines to status HISTORICAL so they are hidden
      if (vaccineData.status === VACCINE_STATUS.GIVEN) {
        await req.models.AdministeredVaccine.sequelize.query(
          `
          UPDATE administered_vaccines
          SET
            status = :newStatus
          FROM encounters
          WHERE
            encounters.id = administered_vaccines.encounter_id
            AND administered_vaccines.status = :status
            AND administered_vaccines.scheduled_vaccine_id = :scheduledVaccineId
            AND encounters.patient_id = :patientId
        `,
          {
            replacements: {
              newStatus: VACCINE_STATUS.HISTORICAL,
              status: VACCINE_STATUS.NOT_GIVEN,
              scheduledVaccineId: vaccineData.scheduledVaccineId,
              patientId,
            },
          },
        );
      }

      return req.models.AdministeredVaccine.create({
        ...vaccineData,
        encounterId,
      });
    });

    res.send(newAdministeredVaccine);
  }),
);

patientVaccineRoutes.get(
  '/:id/administeredVaccines',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientVaccine');

    const where = JSON.parse(req.query.includeNotGiven || false)
      ? {
          status: [VACCINE_STATUS.GIVEN, VACCINE_STATUS.NOT_GIVEN],
        }
      : {};

    const patient = await req.models.Patient.findByPk(req.params.id);
    const {
      orderBy = 'date',
      order = 'ASC',
      rowsPerPage = null,
      page = 0,
      invertNullDateOrdering = false,
      ...rest
    } = req.query;
    // Here we create two custom columns with names that can be referenced by the key
    // in the column object for the DataFetchingTable. These are used for sorting the table.
    const customSortingColumns = {
      attributes: {
        include: [
          [
            // Use either the freetext vaccine name if it exists or the scheduled vaccine label
            Sequelize.fn(
              'COALESCE',
              Sequelize.col('vaccine_name'),
              Sequelize.col('scheduledVaccine.label'),
            ),
            'vaccineDisplayName',
          ],
          [
            // If the vaccine was given elsewhere, use the given_by field which will have the country name saved as text,
            // otherwise use the facility name
            Sequelize.literal(
              `CASE WHEN given_elsewhere THEN given_by ELSE "location->facility"."name" END`,
            ),
            'displayLocation',
          ],
        ],
      },
    };

    let orderWithNulls = order;
    if (orderBy === 'date' && !invertNullDateOrdering) {
      orderWithNulls = order.toLowerCase() === 'asc' ? 'ASC NULLS FIRST' : 'DESC NULLS LAST';
    }

    const results = await patient.getAdministeredVaccines({
      ...rest,
      ...customSortingColumns,
      order: [
        [
          ...orderBy.split('.'),
          // We want the date for vaccine listing to behave a little differently to standard SQL sorting for dates. When
          // Sorting from oldest to newest we want the null values to show at the start of the list, and when sorting
          // from newest to oldest we want the null values to show at the end of the list
          orderWithNulls,
        ],
      ],
      where,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    res.send({ count: results.count, data: results.data });
  }),
);

patientVaccineRoutes.get(
  '/:id/administeredVaccine/:vaccineId/circumstances',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientVaccine');
    const { models, params } = req;
    const administeredVaccine = await models.AdministeredVaccine.findByPk(params.vaccineId);
    if (!administeredVaccine) throw new NotFoundError();
    if (
      !Array.isArray(administeredVaccine.circumstanceIds) ||
      administeredVaccine.circumstanceIds.length === 0
    )
      res.send({ count: 0, data: [] });
    const results = await models.ReferenceData.findAll({
      where: {
        id: administeredVaccine.circumstanceIds,
      },
    });

    res.send({ count: results.count, data: results?.map(({ id, name }) => ({ id, name })) });
  }),
);
