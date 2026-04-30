import {
  ADMINISTRATION_FREQUENCIES,
  DRUG_ROUTES,
  DRUG_UNITS,
} from '@tamanu/constants';

import { generateEncounterPayload } from './createEncounter';
import { nowIso9075, todayDateString } from './dateUtils';
import { RANDOM_PATIENT_NO_OPEN_ENCOUNTER_QUERY } from './randomPatientQuery';

type DrugRow = { id: string };

type MedicationRequestRow = {
  id: string;
  prescription?: { id: string };
  pharmacyOrder?: { encounterId: string };
};


async function fetchNonSensitiveDrugId(context: any): Promise<string> {
  const { api, facilityId } = context.vars;
  const rows = (await api.get('suggestions/drug', {
    facilityId,
    rowsPerPage: '1',
  })) as DrugRow[];
  const first = rows[0];
  if (!first?.id) {
    throw new Error(
      'No drugs available for this facility; seed drug reference data or skip medication scenarios',
    );
  }
  return first.id;
}

async function createOpenEncounterForMedication(
  context: any,
): Promise<{ id: string; startDate?: string }> {
  const { api, facilityId } = context.vars;
  await generateEncounterPayload(context);
  return api.post('encounter', {
    facilityId,
    ...context.vars.encounterPayload,
    endDate: null,
  });
}

/**
 * Open encounter, pick a non-sensitive drug, and set payload for an acute (STAT) encounter prescription.
 * Downstream steps capture prescription / MAR ids and call prepareMedicationPharmacyOrderPayload /
 * prepareMedicationDispensePayload.
 */
export async function prepareMedicationEncounterAcutePharmacyDispenseContext(
  context: any,
  _events: any,
): Promise<void> {
  const { userId } = context.vars;
  const encounter = await createOpenEncounterForMedication(context);
  const medicationId = await fetchNonSensitiveDrugId(context);
  const startDate = encounter.startDate ?? nowIso9075();
  const prescriptionDate = todayDateString();
  const marDate = startDate.slice(0, 10);

  const medicationEncounterPrescriptionBody = {
    date: prescriptionDate,
    startDate,
    route: DRUG_ROUTES.oral,
    medicationId,
    prescriberId: userId,
    quantity: 28,
    doseAmount: 1,
    units: DRUG_UNITS.tablet,
    frequency: ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
    notes: null,
    indication: null,
    isOngoing: false,
    isPrn: false,
    isVariableDose: false,
    isPhoneOrder: false,
  };

  context.vars = {
    ...context.vars,
    medicationEncounterId: encounter.id,
    medicationEncounterPrescriptionBody,
    medicationMarDate: marDate,
    medicationMarGivenTime: startDate,
  };
}

/**
 * After POST /medication/encounterPrescription, capture the new prescription id as `acutePrescriptionId`.
 */
export async function prepareMedicationPharmacyOrderPayload(context: any, _events: any): Promise<void> {
  const { acutePrescriptionId, userId, facilityId } = context.vars;
  if (!acutePrescriptionId) {
    throw new Error(
      'Missing acutePrescriptionId; POST encounter prescription must run before pharmacy order',
    );
  }
  context.vars.medicationPharmacyOrderPayload = {
    orderingClinicianId: userId,
    comments: 'Synthetic medication workflow',
    isDischargePrescription: false,
    facilityId,
    pharmacyOrderPrescriptions: [
      {
        prescriptionId: acutePrescriptionId,
        quantity: 28,
        repeats: 2,
      },
    ],
  };
}

/**
 * After POST encounter pharmacy order, resolve the pharmacy_order_prescription row for dispense.
 */
export async function prepareMedicationDispensePayload(context: any, _events: any): Promise<void> {
  const vars = context.vars;
  const { api, facilityId, userId, acutePrescriptionId, medicationEncounterId } = vars;
  if (!acutePrescriptionId || !medicationEncounterId) {
    throw new Error('Missing prescription or encounter id for dispense lookup');
  }
  const res = (await api.get('medication/medication-requests', {
    facilityId,
    rowsPerPage: '50',
    page: '0',
    orderBy: 'createdAt',
    order: 'desc',
  })) as { data: MedicationRequestRow[] };

  const row = res.data?.find(
    d =>
      d.prescription?.id === acutePrescriptionId &&
      d.pharmacyOrder?.encounterId === medicationEncounterId,
  );
  if (!row?.id) {
    throw new Error(
      'Could not find pharmacy order prescription for synthetic dispense; check medication-requests response',
    );
  }
  const medicationDispensePayload = {
    dispensedByUserId: userId,
    facilityId,
    items: [
      {
        pharmacyOrderPrescriptionId: row.id,
        quantity: 28,
        instructions: 'Synthetic test dispense',
      },
    ],
  };
  Object.assign(vars, { medicationDispensePayload });
}

/**
 * Patient with no active encounter — POST patientOngoingPrescription (ongoing list, not send-to-pharmacy).
 */
export async function preparePatientOngoingPrescriptionContext(context: any, _events: any): Promise<void> {
  const { entityFetcher, userId } = context.vars;
  const randomPatient = await entityFetcher.getRandom('patient', {
    ...RANDOM_PATIENT_NO_OPEN_ENCOUNTER_QUERY,
  });
  const medicationId = await fetchNonSensitiveDrugId(context);
  const startDate = nowIso9075();
  const prescriptionDate = todayDateString();

  const patientOngoingMedicationBody = {
    date: prescriptionDate,
    startDate,
    route: DRUG_ROUTES.oral,
    medicationId,
    prescriberId: userId,
    quantity: 30,
    repeats: 3,
    doseAmount: 1,
    units: DRUG_UNITS.tablet,
    frequency: ADMINISTRATION_FREQUENCIES.DAILY,
    idealTimes: ['08:00'],
    notes: null,
    indication: null,
    isOngoing: true,
    isPrn: false,
    isVariableDose: false,
    isPhoneOrder: false,
  };

  context.vars = {
    ...context.vars,
    patientOngoingMedicationPatientId: randomPatient.id,
    patientOngoingMedicationBody,
  };
}

/**
 * Ongoing-style encounter prescription (twice daily + ideal times) to exercise MAR generation on an admission.
 */
export async function prepareMedicationEncounterOngoingPrescriptionContext(
  context: any,
  _events: any,
): Promise<void> {
  const { userId } = context.vars;
  const encounter = await createOpenEncounterForMedication(context);
  const medicationId = await fetchNonSensitiveDrugId(context);
  const startDate = encounter.startDate ?? nowIso9075();
  const prescriptionDate = todayDateString();

  context.vars = {
    ...context.vars,
    medicationEncounterOngoingId: encounter.id,
    medicationEncounterOngoingPrescriptionBody: {
      date: prescriptionDate,
      startDate,
      route: DRUG_ROUTES.oral,
      medicationId,
      prescriberId: userId,
      quantity: 14,
      doseAmount: 1,
      units: DRUG_UNITS.tablet,
      frequency: ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY,
      idealTimes: ['08:00', '20:00'],
      notes: null,
      indication: null,
      isOngoing: true,
      isPrn: false,
      isVariableDose: false,
      isPhoneOrder: false,
    },
  };
}
