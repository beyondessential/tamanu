import { endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { log } from '../services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

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
      const justBeforeMidnight = endOfDay(parseISO(oldEncounter.startDate));
      await oldEncounter.update({
        endDate: justBeforeMidnight,
        systemNote: 'Automatically discharged',
        discharge: {
          note: 'Automatically discharged by outpatient discharger',
        },
      });

      await handleOngoingPrescriptions(models, oldEncounter, justBeforeMidnight);

      log.info(`Auto-closed encounter with id ${oldEncounter.id}`);
    }

    await sleepAsync(batchSleepAsyncDurationInMilliseconds);
  }
};

const handleOngoingPrescriptions = async (models, encounter) => {
  const prescriptions = await models.Prescription.findAll({
    where: {
      '$encounterPrescription.encounter_id$': encounter.id,
      isOngoing: true,
      discontinued: {
        [Op.not]: true,
      },
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
        ],
      },
    ],
  });

  for (const prescription of prescriptions) {
    const patientId = prescription.encounterPrescription.encounter.patientId;
    const existingOngoingPrescriptionWithSameDetails =
      await models.PatientOngoingPrescription.findPatientOngoingPrescriptionWithSameDetails(
        patientId,
        prescription,
      );

    if (existingOngoingPrescriptionWithSameDetails) continue;

    const existingOngoingPrescriptionsWithDifferentDetails =
      await models.PatientOngoingPrescription.findAll({
        where: {
          patientId,
        },
        include: [
          {
            model: models.Prescription,
            as: 'prescription',
            where: {
              medicationId: prescription.medicationId,
              discontinued: {
                [Op.not]: true,
              },
            },
            attributes: ['id'],
          },
        ],
        attributes: ['id', 'prescriptionId', 'patientId'],
      });

    if (existingOngoingPrescriptionsWithDifferentDetails.length) {
      for (const existingOngoingPrescription of existingOngoingPrescriptionsWithDifferentDetails) {
        await models.Prescription.update(
          {
            discontinuingClinicianId: SYSTEM_USER_UUID,
            discontinued: true,
            discontinuedDate: encounter.endDate,
            discontinuingReason: 'Discontinued by automatic discharging outpatient encounter',
          },
          {
            where: {
              id: existingOngoingPrescription.prescriptionId,
            },
          },
        );
      }
    }

    await models.PatientOngoingPrescription.create({
      patientId: patientId,
      prescriptionId: prescription.id,
    });
  }
};
