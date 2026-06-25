import { Op } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { differenceInYears, parseISO } from 'date-fns';

const ENCOUNTER_SUMMARY_DATA_LIMIT = 20;

/**
 * Fetch the data needed to build a discharge encounter summary prompt.
 *
 * @param {string} encounterId
 * @param {object} models - Sequelize models
 * @returns {Promise<object>}
 */
export async function fetchEncounterSummaryData(encounterId, models) {
  const {
    Encounter,
    EncounterDiagnosis,
    Note,
    Patient,
    PatientAllergy,
    PatientCondition,
    Procedure,
    Prescription,
    Vitals,
    LabRequest,
    ImagingRequest,
  } = models;

  const encounter = await Encounter.findByPk(encounterId, {
    include: Encounter.getFullReferenceAssociations(),
  });

  if (!encounter) {
    return null;
  }

  const patient = await Patient.findByPk(encounter.patientId);

  const allergies = await PatientAllergy.findAll({
    where: { patientId: encounter.patientId },
    include: PatientAllergy.getListReferenceAssociations(),
    order: [['recordedDate', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const conditions = await PatientCondition.findAll({
    where: { patientId: encounter.patientId, resolved: false },
    include: PatientCondition.getListReferenceAssociations(),
    order: [['recordedDate', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const diagnoses = await EncounterDiagnosis.findAll({
    where: {
      encounterId,
      certainty: { [Op.notIn]: ['error', 'disproven'] },
    },
    include: EncounterDiagnosis.getListReferenceAssociations(),
    order: [['createdAt', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const procedures = await Procedure.findAll({
    where: { encounterId },
    include: ['procedureType', 'location', 'leadClinician', 'anaesthetic'],
    order: [['date', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const prescriptions = await Prescription.findAll({
    include: [
      {
        association: 'encounterPrescription',
        where: { encounterId },
        required: true,
      },
      'medication',
    ],
    order: [['date', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const notes = await Note.findAll({
    where: {
      recordId: encounterId,
      recordType: 'Encounter',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
    include: ['author', 'onBehalfOf'],
    order: [['date', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const vitalsRecords = await Vitals.findAll({
    where: { encounterId },
    order: [['dateRecorded', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const labRequests = await LabRequest.findAll({
    where: { encounterId },
    include: [
      { association: 'category' },
      { association: 'priority' },
      { association: 'tests', include: ['labTestType'] },
    ],
    order: [['requestedDate', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  const imagingRequests = await ImagingRequest.findAll({
    where: { encounterId },
    include: [{ association: 'areas' }, { association: 'results' }],
    order: [['requestedDate', 'DESC']],
    limit: ENCOUNTER_SUMMARY_DATA_LIMIT,
  });

  return {
    patient: formatPatient(patient),
    allergies: allergies.map(formatAllergy),
    conditions: conditions.map(formatCondition),
    encounter: formatEncounter(encounter),
    diagnoses: diagnoses.map(formatDiagnosis),
    procedures: procedures.map(formatProcedure),
    medications: prescriptions.map(formatMedication),
    notes: notes.map(formatNote),
    vitals: vitalsRecords[0] ? formatVitals(vitalsRecords[0]) : null,
    labRequests: labRequests.map(formatLabRequest),
    imagingRequests: imagingRequests.map(formatImagingRequest),
  };
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  try {
    return differenceInYears(new Date(), parseISO(dateOfBirth));
  } catch {
    return null;
  }
}

function formatPatient(p) {
  if (!p) return null;
  return {
    firstName: p.firstName,
    age: calculateAge(p.dateOfBirth),
    sex: p.sex,
  };
}

function formatAllergy(a) {
  return {
    allergy: a.allergy?.name,
    reaction: a.reaction?.name,
    note: a.note,
    recordedDate: a.recordedDate,
  };
}

function formatCondition(c) {
  return {
    condition: c.condition?.name,
    recordedDate: c.recordedDate,
    note: c.note,
  };
}

function formatEncounter(e) {
  return {
    encounterType: e.encounterType,
    startDate: e.startDate,
    endDate: e.endDate,
    reasonForEncounter: e.reasonForEncounter,
    department: e.department?.name,
    examiner: e.examiner?.displayName,
    location: e.location?.name,
  };
}

function formatDiagnosis(d) {
  return {
    diagnosis: d.Diagnosis?.name,
    certainty: d.certainty,
    isPrimary: d.isPrimary,
    date: d.date,
  };
}

function formatProcedure(p) {
  return {
    procedure: p.procedureType?.name,
    date: p.date,
    note: p.note,
    completedNote: p.completedNote,
  };
}

function formatMedication(p) {
  return {
    medication: p.medication?.name,
    notes: p.notes,
    date: p.date,
    endDate: p.endDate,
    quantity: p.quantity,
    discontinued: p.discontinued,
    discontinuingReason: p.discontinuingReason,
  };
}

function formatNote(n) {
  return {
    content: n.content,
    date: n.date,
    author: n.author?.displayName,
  };
}

function formatVitals(v) {
  return {
    dateRecorded: v.dateRecorded,
    height: v.height,
    weight: v.weight,
    heartRate: v.heartRate,
    respiratoryRate: v.respiratoryRate,
    sbp: v.sbp,
    dbp: v.dbp,
    temperature: v.temperature,
    spo2: v.spo2,
  };
}

function formatLabRequest(lr) {
  return {
    displayId: lr.displayId,
    category: lr.category?.name,
    priority: lr.priority?.name,
    requestedDate: lr.requestedDate,
    publishedDate: lr.publishedDate,
    status: lr.status,
    resultsInterpretation: lr.resultsInterpretation,
    tests: lr.tests?.map(t => ({
      test: t.labTestType?.name,
      result: t.result,
      completedDate: t.completedDate,
    })),
  };
}

function formatImagingRequest(ir) {
  return {
    displayId: ir.displayId,
    imagingType: ir.imagingType,
    priority: ir.priority,
    requestedDate: ir.requestedDate,
    status: ir.status,
    areas: ir.areas?.map(a => a.name),
    results: ir.results?.map(r => ({
      description: r.description,
      completedAt: r.completedAt,
    })),
  };
}
