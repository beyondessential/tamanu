import config from 'config';
import { isNaN } from 'lodash';

import {
  FhirReference,
  FhirIdentifier,
  FhirAnnotation,
  FhirCodeableConcept,
  FhirCoding,
  FhirDosageInstruction,
  FhirTiming,
  FhirDoseAndRate,
} from '@tamanu/shared/services/fhirTypes';
import type { Models } from '../../../types/model';
import type { PharmacyOrder, PharmacyOrderPrescription, Prescription } from '../../../models';
import { getMedicationDoseDisplay, getTranslatedFrequency } from '@tamanu/shared/utils/medication';
import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';

const CATEGORY_CODE_SYSTEM = 'https://hl7.org/fhir/R4B/codesystem-medicationrequest-category.html';

export async function getValues(upstream: PharmacyOrderPrescription, models: Models) {
  const { PharmacyOrder } = models;
  const pharmacyOrder = await PharmacyOrder.findOne({ where: { id: upstream.pharmacyOrderId } });
  if (!pharmacyOrder) {
    throw new Error(`Pharmacy order not found for ${upstream.id}`);
  }
  const recorder = await recorderRef(pharmacyOrder, models);
  const requester = await requesterRef(pharmacyOrder, models);
  const subject = await subjectRef(pharmacyOrder, models);
  const encounter = await FhirReference.to(models.FhirEncounter, pharmacyOrder.encounterId);
  return {
    lastUpdated: new Date(),
    identifier: [
      new FhirIdentifier({
        system: config.hl7.dataDictionaries.pharmacyOrderPrescriptionId,
        value: upstream.id,
      }),
    ],
    status: 'active',
    intent: 'order',
    category: category(pharmacyOrder),
    groupIdentifier: [
      new FhirIdentifier({
        system: config.hl7.dataDictionaries.pharmacyOrderId,
        value: pharmacyOrder.id,
      }),
    ],
    medication: await medication(upstream, models),
    authoredOn: pharmacyOrder.createdAt,
    dosageInstruction: await dosageInstruction(upstream, models),
    dispenseRequest: {
      quantity: upstream.quantity,
      numberOfRepeatsAllowed: upstream.repeats,
    },
    recorder,
    requester,
    subject,
    encounter,
    note: note(pharmacyOrder, recorder),
    resolved:
      requester.isResolved() &&
      recorder.isResolved() &&
      subject.isResolved() &&
      encounter.isResolved(),
  };
}

async function requesterRef(pharmacyOrder: PharmacyOrder, models: Models) {
  const encounter = await models.Encounter.findOne({
    where: { id: pharmacyOrder.encounterId },
  });
  const location = await models.Location.findOne({
    where: { id: encounter?.locationId },
  });
  const facility = await models.Facility.findOne({
    where: { id: location?.facilityId },
  });
  return FhirReference.to(models.FhirOrganization, facility?.id, {
    display: facility?.name,
  });
}

async function subjectRef(pharmacyOrder: PharmacyOrder, models: Models) {
  const encounter = await models.Encounter.findOne({
    where: { id: pharmacyOrder.encounterId },
  });

  const patient = await models.Patient.findOne({
    where: { id: encounter?.patientId },
  });

  return FhirReference.to(models.FhirPatient, patient?.id, {
    display: `${patient?.firstName} ${patient?.lastName}`,
  });
}

async function recorderRef(pharmacyOrder: PharmacyOrder, models: Models) {
  const orderedByUser = await models.User.findOne({
    where: { id: pharmacyOrder.orderingClinicianId },
  });
  return FhirReference.to(models.FhirPractitioner, orderedByUser?.id, {
    display: orderedByUser?.displayName,
  });
}

async function medication(pharmacyOrderPrescription: PharmacyOrderPrescription, models: Models) {
  const prescription = await models.Prescription.findOne({
    where: { id: pharmacyOrderPrescription.prescriptionId },
  });
  const medication = await models.ReferenceData.findOne({
    where: { id: prescription?.medicationId },
  });
  return new FhirCodeableConcept({
    coding: [
      new FhirCoding({
        system: config.hl7.dataDictionaries.medicationCodeSystem,
        code: medication?.code,
        display: medication?.name,
      }),
    ],
  });
}

async function dosageInstruction(
  pharmacyOrderPrescription: PharmacyOrderPrescription,
  models: Models,
) {
  const prescription = await models.Prescription.findOne({
    where: { id: pharmacyOrderPrescription.prescriptionId },
  });

  if (!prescription) {
    return null;
  }

  const getTranslation = await models.TranslatedString.getTranslationFunction(config.language);
  const getEnumTranslation = await models.TranslatedString.getEnumTranslationFunction(
    config.language,
  );

  const doseAmount = isNaN(parseFloat(prescription.doseAmount))
    ? null
    : parseFloat(prescription.doseAmount);
  return new FhirDosageInstruction({
    text: `${getMedicationDoseDisplay(prescription, getTranslation, getEnumTranslation)} - ${getTranslatedFrequency(prescription.frequency, getTranslation)}`,
    timing: new FhirTiming({
      repeat: {
        ...getFrequencyPeriodUnit(prescription),
        timeOfDay: prescription.idealTimes
          ? prescription.idealTimes.map(time => time.concat(':00')) // Append seconds as its required by FHIR time type
          : null,
      },
    }),
    doseAndRate: [
      new FhirDoseAndRate({
        dose: {
          doseQuantity: {
            value: doseAmount,
            unit: prescription.units,
          },
        },
      }),
    ],
    route: new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: config.hl7.dataDictionaries.medicationRouteCodeSystem,
          code: prescription.route,
        }),
      ],
    }),
  });
}

function getFrequencyPeriodUnit(prescription: Prescription) {
  switch (prescription.frequency) {
    case ADMINISTRATION_FREQUENCIES.DAILY:
    case ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING:
    case ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY:
    case ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT:
      return { periodUnit: 'd', frequency: 1, period: 1 };
    case ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY:
    case ADMINISTRATION_FREQUENCIES.TWICE_DAILY_AM_AND_MIDDAY:
      return { periodUnit: 'd', frequency: 2, period: 1 };
    case ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY:
      return { periodUnit: 'd', frequency: 3, period: 1 };
    case ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY:
      return { periodUnit: 'd', frequency: 4, period: 1 };
    case ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS:
      return { periodUnit: 'h', frequency: 1, period: 4 };
    case ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS:
      return { periodUnit: 'h', frequency: 1, period: 6 };
    case ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS:
      return { periodUnit: 'h', frequency: 1, period: 8 };
    case ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY:
      return { periodUnit: 'd', frequency: 1, period: 2 };
    case ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK:
      return { periodUnit: 'wk', frequency: 1, period: 1 };
    case ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH:
      return { periodUnit: 'mo', frequency: 1, period: 1 };
    case ADMINISTRATION_FREQUENCIES.IMMEDIATELY:
    case ADMINISTRATION_FREQUENCIES.AS_DIRECTED:
      return {};
    default:
      throw new Error(`Unmapped frequency: ${prescription.frequency}`);
  }
}

function category(pharmacyOrder: PharmacyOrder) {
  if (pharmacyOrder.isDischargePrescription) {
    return new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: CATEGORY_CODE_SYSTEM,
          code: 'discharge',
        }),
      ],
    });
  }

  return null;
}

function note(pharmacyOrder: PharmacyOrder, recorder: FhirReference) {
  if (pharmacyOrder.comments) {
    return [
      new FhirAnnotation({
        author: recorder,
        text: pharmacyOrder.comments,
      }),
    ];
  }

  return null;
}
