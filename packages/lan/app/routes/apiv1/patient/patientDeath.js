import express from 'express';
import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from 'shared/constants';
import { InvalidOperationError, NotFoundError } from 'shared/errors';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import {
  PATIENT_DEATH_PARTIAL_SCHEMA,
  PATIENT_DEATH_FULL_SCHEMA,
} from './patientDeathValidationSchema';

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
      models: { ContributingDeathCause, Patient, PatientDeathData, User, Facility, ReferenceData },
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
      where: { patientId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [['createdAt', 'DESC']],
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
          model: ReferenceData,
          as: 'primaryCauseCondition',
        },
        {
          model: ReferenceData,
          as: 'antecedentCause1Condition',
        },
        {
          model: ReferenceData,
          as: 'antecedentCause2Condition',
        },
        {
          model: ContributingDeathCause,
          as: 'contributingCauses',
          include: ['condition'],
        },
      ],
    });

    res.send({
      patientId: patient.id,
      patientDeathDataId: deathData.id,
      clinician: deathData.clinician,
      facility: deathData.facility,
      outsideHealthFacility: deathData.outsideHealthFacility,

      dateOfBirth: patient.dateOfBirth,
      dateOfDeath: patient.dateOfDeath,

      isFinal: deathData.isFinal,
      manner: deathData.manner,
      causes: {
        primary: deathData.primaryCauseCondition
          ? exportCause({
              condition: deathData.primaryCauseCondition,
              timeAfterOnset: deathData.primaryCauseTimeAfterOnset,
            })
          : null,
        antecedent1: deathData.antecedentCause1Condition
          ? exportCause({
              condition: deathData.antecedentCause1Condition,
              timeAfterOnset: deathData.antecedentCause1TimeAfterOnset,
            })
          : null,
        antecedent2: deathData.antecedentCause2Condition
          ? exportCause({
              condition: deathData.antecedentCause2Condition,
              timeAfterOnset: deathData.antecedentCause2TimeAfterOnset,
            })
          : null,
        contributing: deathData.contributingCauses.map(exportCause),
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
      models: { Patient, PatientDeathData, ContributingDeathCause, User },
      params: { id: patientId },
    } = req;

    const { isPartialWorkflow } = req.body;
    const schema = isPartialWorkflow ? PATIENT_DEATH_PARTIAL_SCHEMA : PATIENT_DEATH_FULL_SCHEMA;
    const body = await schema.validate(req.body);

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    const doc = await User.findByPk(body.clinicianId);
    if (!doc) throw new NotFoundError('Discharge clinician not found');

    const existingDeathData = await PatientDeathData.findOne({
      where: { patientId: patient.id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [['createdAt', 'DESC']],
    });

    await transactionOnPostgres(db, async () => {
      await patient.update({ dateOfDeath: body.timeOfDeath });

      const [deathData] = await PatientDeathData.upsert({
        id: existingDeathData?.id,
        isFinal: !isPartialWorkflow,
        antecedentCause1ConditionId: body.antecedentCause1,
        antecedentCause1TimeAfterOnset: body.antecedentCause1Interval,
        antecedentCause2ConditionId: body.antecedentCause2,
        antecedentCause2TimeAfterOnset: body.antecedentCause2Interval,
        birthWeight: body.birthWeight,
        carrierAge: body.ageOfMother,
        carrierExistingConditionId: body.motherExistingCondition,
        carrierPregnancyWeeks: body.numberOfCompletedPregnancyWeeks,
        clinicianId: doc.id,
        externalCauseDate: body.mannerOfDeathDate,
        externalCauseLocation: body.mannerOfDeathLocation,
        externalCauseNotes: body.mannerOfDeathOther,
        facilityId: body.facilityId,
        fetalOrInfant: body.fetalOrInfant === 'yes',
        hoursSurvivedSinceBirth: body.numberOfHoursSurvivedSinceBirth,
        lastSurgeryDate: body.surgeryInLast4Weeks === 'yes' ? body.lastSurgeryDate : null,
        lastSurgeryReasonId: body.lastSurgeryReason,
        manner: body.mannerOfDeath,
        outsideHealthFacility: body.outsideHealthFacility,
        patientId: patient.id,
        pregnancyContributed: body.pregnancyContribute,
        primaryCauseConditionId: body.causeOfDeath,
        primaryCauseTimeAfterOnset: body.causeOfDeathInterval,
        recentSurgery: body.surgeryInLast4Weeks,
        stillborn: body.stillborn,
        wasPregnant: body.pregnant,
        withinDayOfBirth: body.deathWithin24HoursOfBirth
          ? body.deathWithin24HoursOfBirth === 'yes'
          : null,
      });

      if (!isPartialWorkflow && body.otherContributingConditions) {
        for (const condition of body.otherContributingConditions) {
          await ContributingDeathCause.create({
            patientDeathDataId: deathData.id,
            conditionId: condition.cause,
            timeAfterOnset: condition.interval ?? 0,
          });
        }
      }

      if (!existingDeathData) {
        const activeEncounters = await patient.getEncounters({
          where: {
            endDate: null,
          },
        });
        for (const encounter of activeEncounters) {
          await encounter.update({
            endDate: body.timeOfDeath,
            discharge: {
              dischargerId: doc.id,
              note: 'Automatically discharged by registering patient death',
            },
          });
        }
      }
    });

    res.send({
      data: {},
    });
  }),
);

patientDeath.post(
  '/:id/revertDeath',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');
    req.checkPermission('create', 'PatientDeath');

    const {
      db,
      models: { Patient, PatientDeathData, DeathRevertLog },
      params: { id: patientId },
    } = req;

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError('Patient not found');

    const deathData = await PatientDeathData.findOne({
      where: { patientId: patient.id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [['createdAt', 'DESC']],
    });
    if (!deathData) throw new NotFoundError('Death data not found');
    if (deathData.isFinal)
      throw new InvalidOperationError('Death data is final and cannot be reverted.');

    await transactionOnPostgres(db, async () => {
      await DeathRevertLog.create({
        revertTime: getCurrentDateTimeString(),
        deathDataId: deathData.id,
        patientId,
        revertedById: req.user.id,
      });
      await patient.update({ dateOfDeath: null });
      await deathData.update({ visibilityStatus: VISIBILITY_STATUSES.HISTORICAL });
    });

    res.send({
      data: {},
    });
  }),
);

async function transactionOnPostgres(db, transaction) {
  return db.transaction(transaction);
}
