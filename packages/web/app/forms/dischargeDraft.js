/**
 * Reading and writing the clinician's saved discharge form.
 *
 * Kept apart from the form component so the merge rules can be exercised on their own: they are
 * the part of drafts most likely to lose a clinician's work if they go wrong.
 */

/**
 * Whether the discharge draft workflow is exposed to clinicians.
 *
 * Work in progress, awaiting Product design. The workflow is built and tested, and everything
 * behind the entry points is left in place: the tables, the endpoints, and the merge rules in
 * this module. What is hidden is every way a clinician reaches it: saving a draft, the "Draft"
 * tag on an encounter, the unsaved-changes prompt on leaving the form, and restoring a saved
 * draft into the form. With no way to save one, no draft is written while this is false.
 *
 * Each entry point is gated once, on the query that fetches the draft. A disabled query
 * yields nothing and only the gated mutations write the cache, so code deriving from it needs
 * no second check of this flag.
 *
 * It is hidden because supporting tracking of edits to the discharge planning note needs further
 * work, and how that should behave is a product decision still to be made. Once Product has
 * settled it, flip this to true and the workflow comes back.
 *
 * Hidden by Workhorse card A8. The workflow itself is card S3, and its intended behaviour is
 * specified in specs/encounters/discharge-draft.md.
 */
export const IS_DISCHARGE_DRAFT_ENABLED = false;

/**
 * The treatment plan and follow-up notes the form opens with.
 *
 * Without a draft this is the encounter's discharge planning notes, oldest first, so the
 * clinician starts from what was recorded during the admission. With a draft it is the text they
 * left, plus any planning note written since, appended so a colleague's addition still reaches
 * the discharge without overwriting what the clinician typed.
 */
export const buildDischargeNote = ({ draft, dischargeNotes }) => {
  const notes = dischargeNotes ?? [];
  if (!draft) return notes.map(note => note.content).join('\n\n');

  const seededNoteIds = new Set(draft.seededNoteIds ?? []);
  const notesAddedSinceDraft = notes.filter(note => !seededNoteIds.has(note.id));
  return [draft.note ?? '', ...notesAddedSinceDraft.map(note => note.content)]
    .filter(Boolean)
    .join('\n\n');
};

/**
 * The medication rows the form opens with, keyed the way the table's fields are named.
 *
 * A saved line wins outright rather than field by field: the clinician may have deliberately
 * cleared a quantity or repeats, and a null there means "they emptied it", not "fall back to the
 * prescription". Medications with no saved line are ones added since the draft, so they take the
 * live defaults.
 */
export const buildMedicationsInitialValues = ({
  encounterMedications,
  ongoingMedications,
  draft,
  preselectSendToPharmacyOnDischarge,
}) => {
  const draftLinesByPrescriptionId = Object.fromEntries(
    (draft?.medications ?? []).map(line => [line.prescriptionId, line]),
  );
  const medicationsInitialValues = {};

  const addMedication = (medication, isSentToPharmacyByDefault) => {
    const key = medication.id;
    const draftLine = draftLinesByPrescriptionId[key];
    medicationsInitialValues[key] = draftLine
      ? {
          quantity: draftLine.quantity ?? null,
          repeats: draftLine.repeats == null ? '' : draftLine.repeats.toString(),
          sendToPharmacy: Boolean(draftLine.sendToPharmacy),
        }
      : {
          // The quantity as recorded against the prescription. One created without a quantity is
          // stored as zero, so those rows start at 0; prescriptions predating that normalisation
          // still hold null and start empty.
          quantity: medication.quantity ?? null,
          repeats: medication?.repeats?.toString() ?? '0',
          sendToPharmacy: isSentToPharmacyByDefault,
        };
  };

  // Whether encounter medications start preselected for pharmacy is a per-facility setting; the
  // patient's other ongoing medications are never preselected, only sent when the clinician asks
  // for them.
  encounterMedications.forEach(medication =>
    addMedication(medication, preselectSendToPharmacyOnDischarge),
  );
  ongoingMedications.forEach(medication => addMedication(medication, false));
  return medicationsInitialValues;
};

/**
 * A number field the clinician has emptied, ready for a nullable integer column.
 *
 * Draft saves deliberately skip validation — the form is part-finished by definition — so the
 * raw Formik value arrives here, and an emptied number input holds '' rather than null.
 */
const clearedToNull = value => (value === '' || value == null ? null : Number(value));

/** The request body for saving the form as it currently stands. */
export const toDischargeDraftPayload = ({ values, dischargeNotes, isPharmacyOrderEnabled }) => ({
  endDate: values.endDate,
  dischargerId: values.discharge?.dischargerId,
  dispositionId: values.discharge?.dispositionId,
  note: values.discharge?.note,
  // Everything on screen has been folded into the note by now, so the whole current set is what
  // a later resume should treat as already absorbed.
  seededNoteIds: (dischargeNotes ?? []).map(note => note.id),
  orderingClinicianId: isPharmacyOrderEnabled
    ? values.pharmacyOrder?.orderingClinicianId
    : undefined,
  medications: Object.entries(values.medications ?? {}).map(([prescriptionId, medication]) => ({
    prescriptionId,
    quantity: clearedToNull(medication.quantity),
    repeats: clearedToNull(medication.repeats),
    sendToPharmacy: Boolean(medication.sendToPharmacy),
  })),
});
