import { Op } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

const PAST_ENCOUNTER_LIMIT = 20;

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
  } = models;

  // 1. Demographics
  const patient = await Patient.findByPk(patientId, {
    include: ['village'],
  });

  // 2. Allergies
  const allergies = await PatientAllergy.findAll({
    where: { patientId },
    include: PatientAllergy.getListReferenceAssociations(),
  });

  // 3. Ongoing conditions
  const conditions = await PatientCondition.findAll({
    where: { patientId },
    include: PatientCondition.getListReferenceAssociations(),
  });

  // 4. Patient issues / alerts
  const issues = await PatientIssue.findAll({
    where: { patientId },
  });

  // 5. Family history
  const familyHistory = await PatientFamilyHistory.findAll({
    where: { patientId },
    include: PatientFamilyHistory.getListReferenceAssociations(),
  });

  // 6. Care plans
  const carePlans = await PatientCarePlan.findAll({
    where: { patientId },
    include: PatientCarePlan.getListReferenceAssociations(),
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
    });

    activeEncounterNotes = await Note.findAll({
      where: {
        recordId: activeEncounter.id,
        recordType: 'Encounter',
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      include: ['author', 'onBehalfOf'],
      order: [['date', 'DESC']],
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
    limit: PAST_ENCOUNTER_LIMIT,
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
  };
}

function formatPatient(p) {
  if (!p) return null;
  return {
    displayId: p.displayId,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    dateOfDeath: p.dateOfDeath,
    sex: p.sex,
    village: p.village?.name,
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
