import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidOperationError, NotFoundError } from 'shared/errors';
import { User } from 'shared/models/User';
import * as yup from 'yup';

export const patientDeath = express.Router();

patientDeath.post(
  '/:id/death',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');
    req.checkPermission('create', 'PatientDeath');

    const {
      db,
      models: { Discharge, Patient, PatientDeathData, DeathCause },
      params: { id: patientId },
    } = req;

    const ynu = yup
      .string()
      .lowercase()
      .oneOf(['yes', 'no', 'unknown']);

    const yn = yup
      .string()
      .lowercase()
      .oneOf(['yes', 'no']);

    const schema = yup.object().shape({
      timeOfDeath: yup.date().required(),
      clinicianId: yup.string().required(),
      facilityId: yup.string(),

      causeOfDeath: yup.string().required(),
      causeOfDeathInterval: yup.number().default(0),

      causeOfDeath2: yup.string(),
      causeOfDeath2Interval: yup.number().default(0),

      contributingConditions: yup.string(),
      contributingConditionsInterval: yup.number().default(0),

      surgeryInLast4Weeks: ynu,
      lastSurgeryDate: yup.date(),
      lastSurgeryReason: yup.string(),

      pregnant: ynu,
      pregnancyContribute: ynu,

      fetalOrInfant: yn.default('no'),
      stillborn: ynu,
      birthWeight: yup.number(),
      deathWithin24HoursOfBirth: yn,
      numberOfHoursSurvivedSinceBirth: yup.number(),

      ageOfMother: yup.number(),
      motherExistingCondition: yup.string(),
      numberOfCompletedPregnancyWeeks: yup.number(),

      mannerOfDeath: yup.string().required(),

      // actually "external cause"
      mannerOfDeathLocation: yup.string(),
      mannerOfDeathDate: yup.date(),
      mannerOfDeathOther: yup.string(),
    });

    const body = await schema.validate(req.body);

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    if (patient.dateOfDeath) throw new InvalidOperationError('Patient is already deceased');

    const doc = await User.findByPk(body.clinicianId);
    if (!doc) throw new NotFoundError('Discharge clinician not found');

    await transactionOnPostgres(db, async () => {
      await patient.update({ dateOfDeath: body.timeOfDeath });

      const primaryCause = await DeathCause.create({
        patientId: patient.id,
        conditionId: body.causeOfDeath,
        timeAfterOnset: body.causeOfDeathInterval,
      });

      if (body.causeOfDeath2) {
        await DeathCause.create({
          patientId: patient.id,
          conditionId: body.causeOfDeath2,
          timeAfterOnset: body.causeOfDeath2Interval,
        });
      }

      if (body.contributingConditions) {
        await DeathCause.create({
          patientId: patient.id,
          conditionId: body.contributingConditions,
          timeAfterOnset: body.contributingConditionsInterval,
        });
      }

      await PatientDeathData.create({
        patientId: patient.id,
        clinicianId: doc.id,
        facilityId: body.facilityId,
        manner: body.mannerOfDeath,
        primaryCauseId: primaryCause.id,

        recentSurgery: body.surgeryInLast4Weeks,
        lastSurgeryDate: body.surgeryInLast4Weeks === 'yes' ? body.lastSurgeryDate : null,
        lastSurgeryReasonId: body.lastSurgeryReason,

        externalCauseDate: body.mannerOfDeathDate,
        externalCauseLocation: body.mannerOfDeathLocation,
        externalCauseNotes: body.mannerOfDeathOther,

        wasPregnant: body.pregnant,
        pregnancyContributed: body.pregnancyContribute,

        fetalOrInfant: body.fetalOrInfant,
        stillborn: body.stillborn,
        birthWeight: body.birthWeight,
        withinDayOfBirth: body.deathWithin24HoursOfBirth,
        hoursSurvivedSinceBirth: body.numberOfHoursSurvivedSinceBirth,

        carrierAge: body.ageOfMother,
        carrierExistingConditionId: body.motherExistingCondition,
        carrierPregnancyWeeks: body.numberOfCompletedPregnancyWeeks,
      });

      const activeEncounters = await patient.getEncounters({
        where: {
          endDate: null,
        },
      });
      for (const encounter of activeEncounters) {
        await Discharge.create({
          encounterId: encounter.id,
          dischargerId: doc.id,
        });
        await encounter.update({
          endDate: body.timeOfDeath,
        });
      }
    });

    res.send({
      data: {},
    });
  }),
);

async function transactionOnPostgres(db, transaction) {
  if (config.db.sqlitePath) {
    return transaction();
  } else {
    return db.transaction(transaction);
  }
}
