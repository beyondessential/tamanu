import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidOperationError, NotFoundError } from 'shared/errors';
import * as yup from 'yup';

export const patientDeath = express.Router();

function exportCause(cause) {
  return {
    id: cause.id,
    condition: cause.condition,
    timeAfterOnset: cause.timeAfterOnset,
  };
}

patientDeath.get(
  '/:id/death',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientDeath');

    const {
      models: { DeathCause, Patient, PatientDeathData, User, Facility },
      params: { id: patientId },
    } = req;

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    if (!patient.dateOfDeath) {
      res.status(404).send({
        patientId: patient.id,
        dateOfBirth: patient.dateOfBirth,
        dateOfDeath: null,
      });
      return;
    }

    const deathData = await PatientDeathData.findOne({
      where: { patientId },
      include: [
        {
          model: User,
          as: 'clinician',
        },
        {
          model: Facility,
          as: 'facility',
        },
        {
          model: DeathCause,
          as: 'primaryCause',
          include: ['condition'],
        },
        {
          model: DeathCause,
          as: 'antecedentCause1',
          include: ['condition'],
        },
        {
          model: DeathCause,
          as: 'antecedentCause2',
          include: ['condition'],
        },
        {
          model: DeathCause,
          as: 'contributingCauses',
          include: ['condition'],
        },
      ],
    });

    const contributingCauses =
      deathData.contributingCauses?.filter(
        c =>
          ![
            deathData.primaryCause?.id,
            deathData.antecedentCause1?.id,
            deathData.antecedentCause2?.id,
          ].includes(c.id),
      ) ?? [];

    res.send({
      patientId: patient.id,
      patientDeathDataId: deathData.id,
      clinician: deathData.clinician,
      facility: deathData.facility,
      outsideHealthFacility: deathData.outsideHealthFacility,

      dateOfBirth: patient.dateOfBirth,
      dateOfDeath: patient.dateOfDeath,

      manner: deathData.manner,
      causes: {
        primary: deathData.primaryCause ? exportCause(deathData.primaryCause) : null,
        antecedent1: deathData.antecedentCause1 ? exportCause(deathData.antecedentCause1) : null,
        antecedent2: deathData.antecedentCause2 ? exportCause(deathData.antecedentCause2) : null,
        contributing: contributingCauses.map(exportCause),
        external:
          deathData.externalCauseDate ||
          deathData.externalCauseLocation ||
          deathData.externalCauseNotes
            ? {
                date: deathData.externalCauseDate,
                location: deathData.externalCauseLocation,
                notes: deathData.externalCauseNotes,
              }
            : null,
      },

      recentSurgery:
        deathData.recentSurgery === 'yes'
          ? {
              date: deathData.lastSurgeryDate,
              reasonId: deathData.lastSurgeryReasonId,
            }
          : deathData.recentSurgery,

      pregnancy:
        deathData.wasPregnant === 'yes'
          ? {
              contributed: deathData.pregnancyContributed,
            }
          : deathData.wasPregnant,

      fetalOrInfant: deathData.fetalOrInfant
        ? {
            birthWeight: deathData.birthWeight,
            carrier: {
              age: deathData.carrierAge,
              existingConditionId: deathData.carrierExistingConditionId,
              weeksPregnant: deathData.carrierPregnancyWeeks,
            },
            hoursSurvivedSinceBirth: deathData.hoursSurvivedSinceBirth,
            stillborn: deathData.stillborn,
            withinDayOfBirth: deathData.withinDayOfBirth,
          }
        : false,
    });
  }),
);

patientDeath.post(
  '/:id/death',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');
    req.checkPermission('create', 'PatientDeath');

    const {
      db,
      models: { Patient, PatientDeathData, DeathCause, User },
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
      causeOfDeathInterval: yup.number().default(0),
      antecedentCause1: yup.string(),
      antecedentCause1Interval: yup.number().default(0),
      antecedentCause2: yup.string(),
      antecedentCause2Interval: yup.number().default(0),
      clinicianId: yup.string().required(),
      otherContributingConditions: yup.array().of(yup.object()),
      deathWithin24HoursOfBirth: yesNo,
      facilityId: yup.string(),
      outsideHealthFacility: yup.boolean().default(false),
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

      const deathData = await PatientDeathData.create({
        birthWeight: body.birthWeight,
        carrierAge: body.ageOfMother,
        carrierExistingConditionId: body.motherExistingCondition,
        carrierPregnancyWeeks: body.numberOfCompletedPregnancyWeeks,
        clinicianId: doc.id,
        externalCauseDate: body.mannerOfDeathDate,
        externalCauseLocation: body.mannerOfDeathLocation,
        externalCauseNotes: body.mannerOfDeathOther,
        facilityId: body.facilityId,
        outsideHealthFacility: body.outsideHealthFacility,
        fetalOrInfant: body.fetalOrInfant === 'yes',
        hoursSurvivedSinceBirth: body.numberOfHoursSurvivedSinceBirth,
        lastSurgeryDate: body.surgeryInLast4Weeks === 'yes' ? body.lastSurgeryDate : null,
        lastSurgeryReasonId: body.lastSurgeryReason,
        manner: body.mannerOfDeath,
        patientId: patient.id,
        pregnancyContributed: body.pregnancyContribute,
        recentSurgery: body.surgeryInLast4Weeks,
        stillborn: body.stillborn,
        wasPregnant: body.pregnant,
        withinDayOfBirth: body.deathWithin24HoursOfBirth
          ? body.deathWithin24HoursOfBirth === 'yes'
          : null,
      });

      const primaryCause = await DeathCause.create({
        patientDeathDataId: deathData.id,
        conditionId: body.causeOfDeath,
        timeAfterOnset: body.causeOfDeathInterval,
      });

      await deathData.update({
        primaryCauseId: primaryCause.id,
      });

      if (body.antecedentCause1) {
        const antecedentCause1 = await DeathCause.create({
          patientDeathDataId: deathData.id,
          conditionId: body.antecedentCause1,
          timeAfterOnset: body.antecedentCause1Interval,
        });

        await deathData.update({
          antecedentCause1Id: antecedentCause1.id,
        });
      }

      if (body.antecedentCause2) {
        const antecedentCause2 = await DeathCause.create({
          patientDeathDataId: deathData.id,
          conditionId: body.antecedentCause2,
          timeAfterOnset: body.antecedentCause2Interval,
        });

        await deathData.update({
          antecedentCause2Id: antecedentCause2.id,
        });
      }

      if (body.otherContributingConditions) {
        for (const condition of body.otherContributingConditions) {
          await DeathCause.create({
            patientDeathDataId: deathData.id,
            conditionId: condition.cause,
            timeAfterOnset: condition.interval,
          });
        }
      }

      const activeEncounters = await patient.getEncounters({
        where: {
          endDate: null,
        },
      });
      for (const encounter of activeEncounters) {
        await encounter.dischargeWithDischarger(doc, body.timeOfDeath);
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
  }

  return db.transaction(transaction);
}
