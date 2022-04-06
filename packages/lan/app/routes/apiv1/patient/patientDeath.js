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

    const yesNoUnknown = yup
      .string()
      .lowercase()
      .oneOf(['yes', 'no', 'unknown']);

    const yesNo = yup
      .string()
      .lowercase()
      .oneOf(['yes', 'no']);

    const schema = yup.object().shape({
      ageOfMother: yup.number(),
      birthWeight: yup.number(),
      causeOfDeath: yup.string().required(),
      causeOfDeath2: yup.string(),
      causeOfDeath2Interval: yup.number().default(0),
      causeOfDeathInterval: yup.number().default(0),
      clinicianId: yup.string().required(),
      contributingConditions: yup.string(),
      contributingConditionsInterval: yup.number().default(0),
      deathWithin24HoursOfBirth: yesNo,
      facilityId: yup.string(),
      fetalOrInfant: yesNo.default('no'),
      lastSurgeryDate: yup.date(),
      lastSurgeryReason: yup.string(),
      mannerOfDeath: yup.string().required(),
      mannerOfDeathDate: yup.date(),
      mannerOfDeathLocation: yup.string(), // actually "external cause"
      mannerOfDeathOther: yup.string(),
      motherExistingCondition: yup.string(),
      numberOfCompletedPregnancyWeeks: yup.number(),
      numberOfHoursSurvivedSinceBirth: yup.number(),
      pregnancyContribute: yesNoUnknown,
      pregnant: yesNoUnknown,
      stillborn: yesNoUnknown,
      surgeryInLast4Weeks: yesNoUnknown,
      timeOfDeath: yup.date().required(),
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
        birthWeight: body.birthWeight,
        carrierAge: body.ageOfMother,
        carrierExistingConditionId: body.motherExistingCondition,
        carrierPregnancyWeeks: body.numberOfCompletedPregnancyWeeks,
        clinicianId: doc.id,
        externalCauseDate: body.mannerOfDeathDate,
        externalCauseLocation: body.mannerOfDeathLocation,
        externalCauseNotes: body.mannerOfDeathOther,
        facilityId: body.facilityId,
        fetalOrInfant: body.fetalOrInfant,
        hoursSurvivedSinceBirth: body.numberOfHoursSurvivedSinceBirth,
        lastSurgeryDate: body.surgeryInLast4Weeks === 'yes' ? body.lastSurgeryDate : null,
        lastSurgeryReasonId: body.lastSurgeryReason,
        manner: body.mannerOfDeath,
        patientId: patient.id,
        pregnancyContributed: body.pregnancyContribute,
        primaryCauseId: primaryCause.id,
        recentSurgery: body.surgeryInLast4Weeks,
        stillborn: body.stillborn,
        wasPregnant: body.pregnant,
        withinDayOfBirth: body.deathWithin24HoursOfBirth,
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
