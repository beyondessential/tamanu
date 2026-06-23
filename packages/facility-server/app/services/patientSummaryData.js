import { differenceInYears, parseISO } from 'date-fns';
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
    Prescription,
    Procedure,
    Vitals,
    PatientDeathData,
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
  let activeEncounterProcedures = [];
  let activeEncounterVitals = null;

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

    activeEncounterProcedures = await Procedure.findAll({
      where: { encounterId: activeEncounter.id },
      include: ['procedureType'],
      order: [['date', 'DESC']],
      limit: PATIENT_SUMMARY_DATA_LIMIT,
    });

    // Only the most recent vitals set is clinically useful for a summary.
    const [latestVitals] = await Vitals.findAll({
      where: { encounterId: activeEncounter.id },
      order: [['dateRecorded', 'DESC']],
      limit: 1,
    });
    activeEncounterVitals = latestVitals ?? null;
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
      // `separate` runs these as their own queries so multiple hasMany joins
      // don't multiply rows, and lets us limit vitals to the latest set per
      // encounter.
      {
        association: 'procedures',
        separate: true,
        include: ['procedureType'],
        order: [['date', 'DESC']],
        limit: PATIENT_SUMMARY_DATA_LIMIT,
      },
      {
        association: 'vitals',
        separate: true,
        order: [['dateRecorded', 'DESC']],
        limit: 1,
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

  // 12. Medications — a prescription is reachable either through one of the
  // patient's encounters or as a patient-level ongoing (regular) prescription,
  // so gather both paths and merge.
  const medicationInclude = [{ association: 'medication' }, { association: 'prescriber' }];

  const encounterMedications = await Prescription.findAll({
    include: [
      {
        association: 'encounters',
        attributes: ['id'],
        through: { attributes: [] },
        where: { patientId },
        required: true,
      },
      ...medicationInclude,
    ],
    order: [['date', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  const ongoingMedications = await Prescription.findAll({
    include: [
      {
        association: 'patients',
        attributes: ['id'],
        through: { attributes: [] },
        where: { id: patientId },
        required: true,
      },
      ...medicationInclude,
    ],
    order: [['date', 'DESC']],
    limit: PATIENT_SUMMARY_DATA_LIMIT,
  });

  // A prescription can be both encounter-linked and flagged ongoing, so dedupe
  // by id, keep most recent first, and cap at the shared limit.
  const medicationsById = new Map();
  for (const prescription of [...encounterMedications, ...ongoingMedications]) {
    medicationsById.set(prescription.id, prescription);
  }
  const medications = [...medicationsById.values()]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, PATIENT_SUMMARY_DATA_LIMIT);

  // 13. Death information (deceased patients only)
  let deathData = null;
  if (patient?.dateOfDeath) {
    deathData = await PatientDeathData.findOne({
      where: { patientId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [['createdAt', 'DESC']],
      include: [
        { association: 'primaryCauseCondition' },
        { association: 'antecedentCause1Condition' },
        { association: 'antecedentCause2Condition' },
        { association: 'antecedentCause3Condition' },
        { association: 'contributingCauses', include: ['condition'] },
      ],
    });
  }

  return {
    patient: formatPatient(patient),
    death: formatDeath(deathData, patient?.dateOfDeath),
    allergies: allergies.map(formatAllergy),
    conditions: conditions.map(formatCondition),
    issues: issues.map(formatIssue),
    familyHistory: familyHistory.map(formatFamilyHistory),
    carePlans: carePlans.map(formatCarePlan),
    activeEncounter: activeEncounter
      ? formatActiveEncounter(
          activeEncounter,
          activeEncounterDiagnoses,
          activeEncounterNotes,
          activeEncounterProcedures,
          activeEncounterVitals,
        )
      : null,
    pastEncounters: pastEncounters.map(formatPastEncounter),
    vaccinations: vaccinations.map(formatVaccination),
    labRequests: labRequests.map(formatLabRequest),
    imagingRequests: imagingRequests.map(formatImagingRequest),
    medications: medications.map(formatMedication),
  };
}

function getPatientAge({ dateOfBirth, dateOfDeath }) {
  if (!dateOfBirth) return undefined;
  // For a deceased patient, report age at death rather than current age.
  if (dateOfDeath) return differenceInYears(parseISO(dateOfDeath), parseISO(dateOfBirth));
  return ageInYears(dateOfBirth);
}

function formatPatient(p) {
  if (!p) return null;
  return {
    firstName: p.firstName,
    age: getPatientAge(p),
    dateOfDeath: p.dateOfDeath,
    sex: p.sex,
  };
}

function formatDeath(deathData, dateOfDeath) {
  if (!dateOfDeath) return null;

  const formatCause = (condition, timeAfterOnset) =>
    condition ? { condition: condition.name, timeAfterOnset } : null;

  return {
    dateOfDeath,
    manner: deathData?.manner,
    primaryCause: formatCause(
      deathData?.primaryCauseCondition,
      deathData?.primaryCauseTimeAfterOnset,
    ),
    antecedentCauses: [
      formatCause(deathData?.antecedentCause1Condition, deathData?.antecedentCause1TimeAfterOnset),
      formatCause(deathData?.antecedentCause2Condition, deathData?.antecedentCause2TimeAfterOnset),
      formatCause(deathData?.antecedentCause3Condition, deathData?.antecedentCause3TimeAfterOnset),
    ].filter(Boolean),
    contributingCauses:
      deathData?.contributingCauses?.map(c => c.condition?.name).filter(Boolean) ?? [],
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
    resolutionDate: c.resolved ? c.resolutionDate : undefined,
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

function formatActiveEncounter(encounter, diagnoses, notes, procedures, vitals) {
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
    procedures: procedures.map(formatProcedure),
    vitals: vitals ? formatVitals(vitals) : null,
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
    procedures: encounter.procedures?.map(formatProcedure),
    vitals: encounter.vitals?.[0] ? formatVitals(encounter.vitals[0]) : null,
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

function formatMedication(m) {
  return {
    medication: m.medication?.name,
    doseAmount: m.doseAmount,
    units: m.units,
    frequency: m.frequency,
    route: m.route,
    date: m.date,
    startDate: m.startDate,
    endDate: m.endDate,
    isOngoing: m.isOngoing,
    isPrn: m.isPrn,
    indication: m.indication,
    prescriber: m.prescriber?.displayName,
    discontinued: m.discontinued,
    discontinuedDate: m.discontinued ? m.discontinuedDate : undefined,
    discontinuingReason: m.discontinued ? m.discontinuingReason : undefined,
    notes: m.notes,
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
