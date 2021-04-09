import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op } from 'sequelize';
import { ENCOUNTER_TYPES, REFERENCE_TYPES } from 'shared/constants';

export const patientVaccineRoutes = express.Router();

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
            *
          FROM
            administered_vaccines av
            JOIN encounters e ON av.encounter_id = e.id
          WHERE
            e.patient_id = :patientId) av ON sv.id = av.scheduled_vaccine_id
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
          allVaccines[vaccineSchedule.label] = rest;
        }
        allVaccines[vaccineSchedule.label].schedules.push({
          schedule: vaccineSchedule.schedule,
          scheduledVaccineId: vaccineSchedule.id,
          administered: !!vaccineSchedule.administered,
        });
        return allVaccines;
      }, {});
    res.send(Object.values(vaccines));
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
        examinerId: req.body.examinerId,
        departmentId: req.body.departmentId,
      });
      encounterId = newEncounter.get('id');
    }

    const newRecord = await req.models.AdministeredVaccine.create({
      status: 'UNKNOWN',
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
    const results = await req.models.AdministeredVaccine.findAll({
      where: {
        ['$Encounter.patient_id$']: req.params.id,
      },
      include: [
        {
          model: req.models.Encounter,
          as: 'encounter',
          include: req.models.Encounter.getFullReferenceAssociations(),
        },
        {
          model: req.models.ScheduledVaccine,
          as: 'scheduledVaccine',
        },
      ],
    });

    // TODO: enable pagination for this endpoint
    res.send({ count: results.length, data: results });
  }),
);
