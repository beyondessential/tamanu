import { endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import { getCurrentDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import { log } from '../services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import {  SYSTEM_USER_UUID } from '@tamanu/constants';

export const getDischargeOutPatientEncountersWhereClause = () => {
  const today = getCurrentDateString();

  return {
    encounterType: 'clinic',
    endDate: null,
    startDate: {
      [Op.lt]: today,
    },
  };
};

export const dischargeOutpatientEncounters = async (
  models,
  sequelize,
  ids,
  batchSize = 1000,
  batchSleepAsyncDurationInMilliseconds = 50,
) => {
  const where = getDischargeOutPatientEncountersWhereClause();

  // If ids are passed in then we narrow down the encounters to only these ids
  if (ids && ids.length) {
    where.id = { [Op.in]: ids };
  }

  const oldEncountersCount = await models.Encounter.count({ where });
  const batchCount = Math.ceil(oldEncountersCount / batchSize);

  log.info(
    `Auto-closing ${oldEncountersCount} clinic encounters in ${batchCount} batch(es) (${batchSize} records per batch)`,
  );

  for (let i = 0; i < batchCount; i++) {
    const oldEncounters = await models.Encounter.findAll({
      where,
      limit: batchSize,
    });

    for (const oldEncounter of oldEncounters) {

      await sequelize.transaction(async (transaction) => {
        const justBeforeMidnight = endOfDay(parseISO(oldEncounter.startDate));
        await oldEncounter.update({
          endDate: justBeforeMidnight,
          systemNote: 'Automatically discharged',
          discharge: {
            note: 'Automatically discharged by outpatient discharger',
          },
        }, { transaction });

        await handleOngoingPrescriptions(models, oldEncounter, justBeforeMidnight, transaction);
      });
      
      log.info(`Auto-closed encounter with id ${oldEncounter.id}`);
    }

    await sleepAsync(batchSleepAsyncDurationInMilliseconds);
  }
};

const handleOngoingPrescriptions = async (models, oldEncounter, justBeforeMidnight, transaction) => {
  const prescriptions = await models.Prescription.findAll({
    where: {
      '$encounterPrescription.encounter_id$': oldEncounter.id,
      isOngoing: true,
      discontinued: null,
    },
    include: [
      {
        model: models.EncounterPrescription,
        as: 'encounterPrescription',
        attributes: ['encounterId'],
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
            attributes: ['patientId'],
          },
        ]
      },
    ],
    transaction,
  });

  for (const prescription of prescriptions) {
    const patientId = prescription.encounterPrescription.encounter.patientId;
    const ongoingMedicationWithSameDetails = await models.PatientOngoingPrescription.findPatientOngoingMedicationWithSameDetails(patientId, prescription);
    
    if (ongoingMedicationWithSameDetails) continue;

    const ongoingMedication = await models.PatientOngoingPrescription.findOne({
      where: {
        patientId: patientId,
      },
      include: [
        {
          model: models.Prescription,
          as: 'prescription',
          where: {
            medicationId: prescription.medicationId,
            discontinued: null,
          },
          attributes: ['id'],
        },
      ],
      attributes: ['id', 'prescriptionId', 'patientId'],
      transaction,
    });

    if (ongoingMedication && ongoingMedication.prescriptionId) {
      await models.Prescription.update({
        discontinuingClinicianId: SYSTEM_USER_UUID,
        discontinued: true,
        discontinuedDate: toDateTimeString(justBeforeMidnight),
        discontinuingReason: 'Discontinued by automatic discharging outpatient encounter',
      }, {
        where: {
          id: ongoingMedication.prescriptionId,
        },
        transaction,
      });
    }

    await models.PatientOngoingPrescription.create({
      patientId: patientId,
      prescriptionId: prescription.id,
    }, { transaction });
  }
}
