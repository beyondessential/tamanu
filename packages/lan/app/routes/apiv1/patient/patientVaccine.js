import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op } from 'sequelize';
import { ENCOUNTER_TYPES } from 'shared/constants';
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
            e.patient_id = :patientId) av ON sv.id = av.scheduled_vaccine_id AND av.status = 'GIVEN'
        ${whereClause}
        GROUP BY sv.id
        ORDER BY max(sv.label), max(sv.schedule);
      `,
      {
        replacements: {
          patientId: req.params.id,
          category: req.query.category,
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
    req.checkPermission('create', 'PatientVaccine');
    if (!req.body.scheduledVaccineId) {
      res.status(400).send({ error: { message: 'scheduledVaccineId is required' } });
    }

    let encounterId;
    const existingEncounter = await req.models.Encounter.findOne({
      where: {
        endDate: {
          [Op.is]: null,
        },
        patientId: req.params.id,
      },
    });

    if (existingEncounter) {
      encounterId = existingEncounter.get('id');
    } else {
      const newEncounter = await req.models.Encounter.create({
        encounterType: ENCOUNTER_TYPES.CLINIC,
        startDate: req.body.date,
        endDate: req.body.date,
        patientId: req.params.id,
        locationId: req.body.locationId,
        examinerId: req.body.recorderId,
        departmentId: req.body.departmentId,
      });
      encounterId = newEncounter.get('id');
    }

    const newRecord = await req.models.AdministeredVaccine.create({
      status: 'GIVEN',
      ...req.body,
      encounterId,
    });
    res.send(newRecord);
  }),
);

patientVaccineRoutes.get(
  '/:id/administeredVaccines',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientVaccine');

    const patient = await req.models.Patient.findByPk(req.params.id);
    const results = await patient.getAdministeredVaccines();

    // TODO: enable pagination for this endpoint
    res.send({ count: results.length, data: results });
  }),
);

patientVaccineRoutes.get(
  '/:id/certifiableVaccines',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientVaccine');

    // console.log(req.models);
    const certifiedVaccineIds = await req.models.CertifiableVaccine.allVaccineIds();
    const patient = await req.models.Patient.findByPk(req.params.id);
    const results = await patient.getAdministeredVaccines();

    // TODO: enable pagination for this endpoint
    res.send({ count: results.length, data: results });
  }),
);
