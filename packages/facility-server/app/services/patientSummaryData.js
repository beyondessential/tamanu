import { Op } from 'sequelize';
import { VACCINE_STATUS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { ageInYears } from '@tamanu/utils/dateTime';

const PATIENT_SUMMARY_DATA_LIMIT = 20;

/**
 * Fetch the data needed to build a patient summary prompt.
 *
 * @param {string} patientId
 * @param {object} models - Sequelize models
 * @returns {Promise<object>}
 */
export async function fetchPatientSummaryData(patientId, models) {
  const {
    Patient,
    PatientAllergy,
    PatientCondition,
    PatientIssue,
    PatientFamilyHistory,
    PatientCarePlan,
    Encounter,
    EncounterDiagnosis,
    Note,
    AdministeredVaccine,
    LabRequest,
    ImagingRequest,
  } = models;

  // 1. Demographics
  const patient = await Patient.findByPk(patientId, {
    include: ['village'],
  });

  // 2. Allergies
  const allergies = await PatientAllergy.findAll({
    where: { patientId },
    include: PatientAllergy.getListReferenceAssociations(),
    order: [['recordedDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 3. Ongoing conditions
  const conditions = await PatientCondition.findAll({
    where: { patientId },
    include: PatientCondition.getListReferenceAssociations(),
    order: [['recordedDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 4. Patient issues / alerts
  const issues = await PatientIssue.findAll({
    where: { patientId },
    order: [['recordedDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 5. Family history
  const familyHistory = await PatientFamilyHistory.findAll({
    where: { patientId },
    include: PatientFamilyHistory.getListReferenceAssociations(),
    order: [['recordedDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 6. Care plans
  const carePlans = await PatientCarePlan.findAll({
    where: { patientId },
    include: PatientCarePlan.getListReferenceAssociations(),
    order: [['date', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 7. Current active encounter (endDate IS NULL)
  const activeEncounter = await Encounter.findOne({
    where: { patientId, endDate: null },
    include: Encounter.getFullReferenceAssociations(),
    order: [['startDate', 'DESC']],
  });

  let activeEncounterDiagnoses = [];
  let activeEncounterNotes = [];

  if (activeEncounter) {
    activeEncounterDiagnoses = await EncounterDiagnosis.findAll({
      where: { encounterId: activeEncounter.id },
      include: EncounterDiagnosis.getListReferenceAssociations(),
      order: [['createdAt', 'DESC']],
      limit: PATIENT_SUMMARY_DATA_LIMIT,
    });

    activeEncounterNotes = await Note.findAll({
      where: {
        recordId: activeEncounter.id,
        recordType: 'Encounter',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      include: ['author', 'onBehalfOf'],
      order: [['date', 'DESC']],
      limit: PATIENT_SUMMARY_DATA_LIMIT,
    });
  }

  // 8. Past encounters (lightweight: dates, type, diagnoses)
  const pastEncounterWhere = { patientId };
  if (activeEncounter) {
    pastEncounterWhere.id = { [Op.ne]: activeEncounter.id };
  }

  const pastEncounters = await Encounter.findAll({
    where: pastEncounterWhere,
    include: [
      'department',
      'examiner',
      {
        association: 'diagnoses',
        include: EncounterDiagnosis.getListReferenceAssociations(),
      },
    ],
    order: [['startDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // Encounter-linked clinical records are joined back to the patient via their
  // encounters with `required: true`, which makes Sequelize emit an INNER JOIN.

  // 9. Vaccinations (excluding records marked in error)
  const vaccinations = await AdministeredVaccine.findAll({
    where: { status: { [Op.ne]: VACCINE_STATUS.RECORDED_IN_ERROR } },
    include: [
      {
        association: 'encounter',
        attributes: ['id'],
        where: { patientId },
        required: true,
      },
      {
        association: 'scheduledVaccine',
        include: ['vaccine'],
      },
    ],
    order: [['date', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 10. Recent lab requests with results
  const labRequests = await LabRequest.findAll({
    include: [
      {
        association: 'encounter',
        attributes: ['id', 'startDate'],
        where: { patientId },
        required: true,
      },
      { association: 'category' },
      { association: 'priority' },
      { association: 'tests', include: ['labTestType'] },
    ],
    order: [['requestedDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // 11. Recent imaging requests with results
  const imagingRequests = await ImagingRequest.findAll({
    include: [
      {
        association: 'encounter',
        attributes: ['id', 'startDate'],
        where: { patientId },
        required: true,
      },
      { association: 'areas' },
      { association: 'results' },
    ],
    order: [['requestedDate', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  return {
    patient: formatPatient(patient),
    allergies: allergies.map(formatAllergy),
    conditions: conditions.map(formatCondition),
    issues: issues.map(formatIssue),
    familyHistory: familyHistory.map(formatFamilyHistory),
    carePlans: carePlans.map(formatCarePlan),
    activeEncounter: activeEncounter
      ? formatActiveEncounter(activeEncounter, activeEncounterDiagnoses, activeEncounterNotes)
      : null,
    pastEncounters: pastEncounters.map(formatPastEncounter),
    vaccinations: vaccinations.map(formatVaccination),
    labRequests: labRequests.map(formatLabRequest),
    imagingRequests: imagingRequests.map(formatImagingRequest),
  };
}

function formatPatient(p) {
  if (!p) return null;
  return {
    firstName: p.firstName,
    age: p.dateOfBirth ? ageInYears(p.dateOfBirth) : undefined,
    dateOfDeath: p.dateOfDeath,
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
    resolved: c.resolved,
    recordedDate: c.recordedDate,
    resolutionDate: c.resolutionDate,
    note: c.note,
  };
}

function formatIssue(i) {
  return {
    type: i.type,
    note: i.note,
    recordedDate: i.recordedDate,
  };
}

function formatFamilyHistory(fh) {
  return {
    diagnosis: fh.diagnosis?.name,
    relationship: fh.relationship,
    note: fh.note,
    recordedDate: fh.recordedDate,
  };
}

function formatCarePlan(cp) {
  return {
    carePlan: cp.carePlan?.name,
    date: cp.date,
  };
}

function formatActiveEncounter(encounter, diagnoses, notes) {
  return {
    encounterType: encounter.encounterType,
    startDate: encounter.startDate,
    reasonForEncounter: encounter.reasonForEncounter,
    department: encounter.department?.name,
    examiner: encounter.examiner?.displayName,
    location: encounter.location?.name,
    diagnoses: diagnoses.map(d => ({
      diagnosis: d.Diagnosis?.name,
      certainty: d.certainty,
      isPrimary: d.isPrimary,
    })),
    notes: notes.map(n => ({
      content: n.content,
      date: n.date,
      author: n.author?.displayName,
    })),
  };
}

function formatPastEncounter(encounter) {
  return {
    encounterType: encounter.encounterType,
    startDate: encounter.startDate,
    endDate: encounter.endDate,
    department: encounter.department?.name,
    diagnoses: encounter.diagnoses?.map(d => ({
      diagnosis: d.Diagnosis?.name,
      certainty: d.certainty,
      isPrimary: d.isPrimary,
    })),
  };
}

function formatVaccination(v) {
  return {
    vaccine: v.scheduledVaccine?.vaccine?.name ?? v.vaccineName,
    doseLabel: v.scheduledVaccine?.doseLabel,
    date: v.date,
    status: v.status,
    batch: v.batch,
    givenElsewhere: v.givenElsewhere,
    reason: v.reason,
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
