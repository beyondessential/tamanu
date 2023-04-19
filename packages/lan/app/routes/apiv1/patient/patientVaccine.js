import express from 'express';
import asyncHandler from 'express-async-handler';
import Sequelize, { QueryTypes, Op } from 'sequelize';
import config from 'config';

import {
  ENCOUNTER_TYPES,
  VACCINE_CATEGORIES,
  VACCINE_STATUS,
  SETTING_KEYS,
} from 'shared/constants';
import { NotFoundError } from 'shared/errors';

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
        allVaccines[vaccineSchedule.label].schedules.push({
          schedule: vaccineSchedule.schedule,
          scheduledVaccineId: vaccineSchedule.id,
          administered: asRealNumber(vaccineSchedule.administered) > 0,
        });
        return allVaccines;
      }, {});
    res.send(Object.values(vaccines));
  }),
);

patientVaccineRoutes.put(
  '/:id/administeredVaccine/:vaccineId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'PatientVaccine');
    const object = await models.AdministeredVaccine.findByPk(params.vaccineId);
    if (!object) throw new NotFoundError();
    req.checkPermission('write', 'PatientVaccine');
    await object.update(req.body);
    res.send(object);
  }),
);

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
        patientId: req.params.id,
      },
    });

    let { departmentId, locationId } = vaccineData;

    if (!departmentId || !locationId) {
      const vaccinationDefaults =
        (await models.Setting.get(SETTING_KEYS.VACCINATION_DEFAULTS, config.serverFacilityId)) ||
        {};
      departmentId = departmentId || vaccinationDefaults.departmentId;
      locationId = locationId || vaccinationDefaults.locationId;
    }

    const newAdministeredVaccine = await db.transaction(async () => {
      let encounterId;
      if (existingEncounter) {
        encounterId = existingEncounter.get('id');
      } else {
        const newEncounter = await req.models.Encounter.create({
          encounterType: ENCOUNTER_TYPES.CLINIC,
          startDate: vaccineData.date,
          patientId: req.params.id,
          examinerId: vaccineData.recorderId,
          locationId,
          departmentId,
        });
        await newEncounter.update({ endDate: req.body.date });
        encounterId = newEncounter.get('id');
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
    const { orderBy = 'date', order = 'ASC', ...rest } = req.query;
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

    const results = await patient.getAdministeredVaccines({
      ...rest,
      ...customSortingColumns,
      order: [[...orderBy.split('.'), order]],
      where,
    });

    // TODO: enable pagination for this endpoint
    res.send({ count: results.length, data: results });
  }),
);
