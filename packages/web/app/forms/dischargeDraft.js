/**
 * Reading and writing the clinician's saved discharge form.
 *
 * Kept apart from the form component so the merge rules can be exercised on their own: they are
 * the part of drafts most likely to lose a clinician's work if they go wrong.
 */

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
  isPharmacyOrderEnabled,
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
          // Left blank rather than zeroed when the prescription has no quantity, so the clinician
          // sees an empty field to fill in rather than a number nobody entered.
          quantity: medication.quantity ?? null,
          repeats: medication?.repeats?.toString() ?? '0',
          sendToPharmacy: isSentToPharmacyByDefault,
        };
  };

  // Medications prescribed during the encounter are sent to pharmacy on discharge by default; the
  // patient's other ongoing medications are only sent when the clinician asks for them.
  encounterMedications.forEach(medication => addMedication(medication, isPharmacyOrderEnabled));
  ongoingMedications.forEach(medication => addMedication(medication, false));
  return medicationsInitialValues;
};

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
    quantity: medication.quantity ?? null,
    repeats:
      medication.repeats === '' || medication.repeats == null ? null : Number(medication.repeats),
    sendToPharmacy: Boolean(medication.sendToPharmacy),
  })),
});
