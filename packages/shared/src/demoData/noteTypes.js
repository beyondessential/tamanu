import { REFERENCE_TYPES, VISIBILITY_STATUSES } from '../constants';

export const configurationNoteTypeIds = {
  treatmentPlanNoteTypeId: "NoteType-TreatmentPlan",
  clinicalMobileNoteTypeId: "NoteType-ClinicalMobile",
  areaToBeImagedNoteTypeId: "NoteType-AreaToBeImaged",
  dischargeNoteTypeId: "NoteType-Discharge",
  handoverNoteTypeId: "NoteType-Handover",
  systemNoteTypeId: "NoteType-System",
  otherNoteTypeId: "NoteType-Other",
}

const NOTE_TYPES = [
  {
    id: configurationNoteTypeIds.handoverNoteTypeId,
    name: "Handover",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "Handover",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: configurationNoteTypeIds.areaToBeImagedNoteTypeId,
    name: "Area To Be Imaged",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "AreaToBeImaged",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: configurationNoteTypeIds.clinicalMobileNoteTypeId,
    name: "Clinical note (mobile)",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "ClinicalMobile",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: configurationNoteTypeIds.systemNoteTypeId,
    name: "System",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "System",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: "NoteType-Dietary",
    name: "Dietary",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "Dietary",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: configurationNoteTypeIds.otherNoteTypeId,
    name: "Other",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "Other",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: configurationNoteTypeIds.treatmentPlanNoteTypeId,
    name: "Treatment Plan",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "TreatmentPlan",
    type: REFERENCE_TYPES.NOTE_TYPE,
  },
  {
    id: configurationNoteTypeIds.dischargeNoteTypeId,
    name: "Discharge",
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    code: "Discharge",
    type: REFERENCE_TYPES.NOTE_TYPE,
  }
];

export async function seedNoteTypes(models) {
  const { ReferenceData } = models;
  return Promise.all(
    NOTE_TYPES.map(type => ReferenceData.create(type)),
  );

}
